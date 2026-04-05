import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Github, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Project } from "@/types/project";
import { useGithubToken } from "@/hooks/useGithubToken";
import { GithubConnectionButton } from "./GithubConnectionButton";
import { fetchRepositoryStats } from "@/services/githubStats";

interface ProjectGithubTabProps {
  project: Project;
  onRefresh: (updatedProject?: Project) => void;
}

export function ProjectGithubTab({ project, onRefresh }: ProjectGithubTabProps) {
  const { toast } = useToast();
  const { isAuthenticated, repos, loading: reposLoading, token } = useGithubToken();
  const [selectedGithubRepo, setSelectedGithubRepo] = useState<string>(project.github_repo_full_name || "none");
  const [savingGithub, setSavingGithub] = useState(false);
  const [githubStats, setGithubStats] = useState<Awaited<ReturnType<typeof fetchRepositoryStats>> | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    setSelectedGithubRepo(project.github_repo_full_name || "none");
    setGithubStats(null);
  }, [project.id, project.github_repo_full_name]);

  useEffect(() => {
    if (!project.github_repo_full_name || !token) {
      setGithubStats(null);
      setLoadingStats(false);
      return;
    }

    setGithubStats(null);
    setLoadingStats(false);

    const currentProjectId = project.id;
    const currentRepo = project.github_repo_full_name;
    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setLoadingStats(true);
      fetchRepositoryStats(currentRepo, token)
        .then(stats => {
          if (cancelled) return;
          if (project.id === currentProjectId && project.github_repo_full_name === currentRepo) {
            setGithubStats(stats);
          }
        })
        .catch(err => {
          if (cancelled) return;
          if (project.id === currentProjectId) {
            toast({
              title: "Erro ao carregar estatísticas",
              description: err.message || "Não foi possível buscar as estatísticas do repositório.",
              variant: "destructive",
            });
          }
        })
        .finally(() => {
          if (!cancelled && project.id === currentProjectId) {
            setLoadingStats(false);
          }
        });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [project.id, project.github_repo_full_name, token]);

  const handleSaveGithubRepo = async () => {
    try {
      setSavingGithub(true);
      const updateData: Record<string, unknown> = {};

      if (selectedGithubRepo && selectedGithubRepo !== "none") {
        const selectedRepo = repos.find(r => r.full_name === selectedGithubRepo);
        if (selectedRepo) {
          updateData.github_repo_full_name = selectedRepo.full_name;
          updateData.github_repo_url = selectedRepo.html_url;
          updateData.github_sync_enabled = true;

          if (token) {
            try {
              setLoadingStats(true);
              const stats = await fetchRepositoryStats(selectedRepo.full_name, token);
              setGithubStats(stats);
              updateData.github_last_sync_at = stats.lastSyncAt;
            } catch (statsError: unknown) {
              toast({
                title: "Aviso",
                description: `Repositório vinculado, mas não foi possível carregar as estatísticas: ${statsError instanceof Error ? statsError.message : 'Erro desconhecido'}`,
                variant: "default",
              });
            } finally {
              setLoadingStats(false);
            }
          }
        }
      } else {
        updateData.github_repo_full_name = null;
        updateData.github_repo_url = null;
        updateData.github_sync_enabled = false;
        setGithubStats(null);
      }

      const { data: updatedProject, error } = await supabase
        .from('projetos')
        .update(updateData)
        .eq('id', project.id)
        .select()
        .single();

      if (error) throw error;
      if (!updatedProject) throw new Error('Projeto não encontrado após atualização');

      toast({
        title: "Repositório atualizado",
        description: selectedGithubRepo && selectedGithubRepo !== "none"
          ? `Repositório ${selectedGithubRepo} vinculado com sucesso${githubStats ? '. Estatísticas carregadas.' : ''}`
          : "Repositório removido do projeto",
      });

      onRefresh(updatedProject);
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o repositório",
        variant: "destructive",
      });
    } finally {
      setSavingGithub(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              <span>Integração GitHub</span>
            </div>
            <GithubConnectionButton />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="github-repo-select">Repositório GitHub</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedGithubRepo}
                    onValueChange={setSelectedGithubRepo}
                    disabled={reposLoading || savingGithub}
                  >
                    <SelectTrigger id="github-repo-select">
                      <SelectValue placeholder="Selecione um repositório (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum repositório</SelectItem>
                      {repos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.full_name}>
                          <div className="flex items-center gap-2">
                            <Github className="h-3 w-3" />
                            <span>{repo.full_name}</span>
                            {repo.private && (
                              <span className="text-xs text-muted-foreground">(privado)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleSaveGithubRepo}
                    disabled={savingGithub || selectedGithubRepo === (project.github_repo_full_name || "none")}
                    size="sm"
                  >
                    {savingGithub ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
              {project.github_repo_full_name && (
                <div className="mt-4 space-y-4">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      <strong>Repositório atual:</strong>{" "}
                      <a
                        href={project.github_repo_url || `https://github.com/${project.github_repo_full_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {project.github_repo_full_name}
                      </a>
                    </p>
                    {project.github_last_sync_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Última sincronização: {new Date(project.github_last_sync_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>

                  {loadingStats ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-3 text-muted-foreground">Carregando estatísticas do GitHub...</span>
                    </div>
                  ) : githubStats ? (
                    <div className="space-y-6">
                      {/* Informações do Repositório */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Informações do Repositório</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Stars</p>
                              <p className="text-lg font-semibold">{githubStats.repository.stars.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Forks</p>
                              <p className="text-lg font-semibold">{githubStats.repository.forks.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Watchers</p>
                              <p className="text-lg font-semibold">{githubStats.repository.watchers.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Linguagem</p>
                              <p className="text-lg font-semibold">{githubStats.repository.language}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Tamanho</p>
                              <p className="text-lg font-semibold">{(githubStats.repository.size / 1024).toFixed(2)} MB</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Branch Padrão</p>
                              <p className="text-lg font-semibold">{githubStats.branches.default}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Criado em</p>
                              <p className="text-sm font-semibold">{new Date(githubStats.repository.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Última atualização</p>
                              <p className="text-sm font-semibold">{new Date(githubStats.repository.updated_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Commits */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Commits (últimos 30 dias)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Total de Commits</p>
                              <p className="text-2xl font-semibold">{githubStats.totalCommits}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Linhas Adicionadas</p>
                              <p className="text-2xl font-semibold text-green-600">+{githubStats.totalLines.additions.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Linhas Removidas</p>
                              <p className="text-2xl font-semibold text-red-600">-{githubStats.totalLines.deletions.toLocaleString()}</p>
                            </div>
                          </div>
                          {githubStats.recentCommits.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2">Commits Recentes</p>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {githubStats.recentCommits.map((commit) => (
                                  <div key={commit.sha} className="p-2 border rounded text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                      <code className="text-xs bg-muted px-1 rounded">{commit.sha}</code>
                                      <span className="text-muted-foreground text-xs">por {commit.author}</span>
                                      <span className="text-muted-foreground text-xs">
                                        {format(parseISO(commit.date), 'dd/MM/yyyy', { locale: ptBR })}
                                      </span>
                                    </div>
                                    <p className="font-medium">{commit.message}</p>
                                    {(commit.additions > 0 || commit.deletions > 0) && (
                                      <div className="flex items-center gap-2 mt-1 text-xs">
                                        <span className="text-green-600">+{commit.additions}</span>
                                        <span className="text-red-600">-{commit.deletions}</span>
                                        {commit.url && (
                                          <a href={commit.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-auto">
                                            Ver no GitHub
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Contribuidores */}
                      {githubStats.contributors.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Contribuidores</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {githubStats.contributors.map((contributor) => (
                                <div key={contributor.login} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <img src={contributor.avatar_url} alt={contributor.login} className="w-10 h-10 rounded-full" />
                                    <div>
                                      <p className="font-medium">{contributor.login}</p>
                                      <p className="text-xs text-muted-foreground">{contributor.commits} commits</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                      <p className="text-green-600 font-semibold">+{contributor.additions.toLocaleString()}</p>
                                      <p className="text-xs text-muted-foreground">adicionadas</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-red-600 font-semibold">-{contributor.deletions.toLocaleString()}</p>
                                      <p className="text-xs text-muted-foreground">removidas</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Pull Requests */}
                      {githubStats.pullRequests && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Pull Requests</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="text-xl font-semibold">{githubStats.pullRequests.total}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Abertos</p>
                                <p className="text-xl font-semibold text-blue-600">{githubStats.pullRequests.open}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Fechados</p>
                                <p className="text-xl font-semibold text-gray-600">{githubStats.pullRequests.closed}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Mergeados</p>
                                <p className="text-xl font-semibold text-green-600">{githubStats.pullRequests.merged}</p>
                              </div>
                            </div>
                            {githubStats.pullRequests.recent.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold mb-2">PRs Recentes</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {githubStats.pullRequests.recent.map((pr) => (
                                    <div key={pr.number} className="p-2 border rounded text-sm">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                          pr.state === 'open' ? 'bg-blue-100 text-blue-800' :
                                          pr.merged_at ? 'bg-green-100 text-green-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {pr.merged_at ? 'Merged' : pr.state}
                                        </span>
                                        <span className="text-muted-foreground text-xs">#{pr.number}</span>
                                        <span className="text-muted-foreground text-xs">por {pr.author}</span>
                                      </div>
                                      <p className="font-medium">{pr.title}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Issues */}
                      {githubStats.issues && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Issues</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="text-xl font-semibold">{githubStats.issues.total}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Abertas</p>
                                <p className="text-xl font-semibold text-orange-600">{githubStats.issues.open}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Fechadas</p>
                                <p className="text-xl font-semibold text-gray-600">{githubStats.issues.closed}</p>
                              </div>
                            </div>
                            {githubStats.issues.recent.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold mb-2">Issues Recentes</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {githubStats.issues.recent.map((issue) => (
                                    <div key={issue.number} className="p-2 border rounded text-sm">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                          issue.state === 'open' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {issue.state}
                                        </span>
                                        <span className="text-muted-foreground text-xs">#{issue.number}</span>
                                        <span className="text-muted-foreground text-xs">por {issue.author}</span>
                                      </div>
                                      <p className="font-medium">{issue.title}</p>
                                      {issue.labels.length > 0 && (
                                        <div className="flex gap-1 mt-1">
                                          {issue.labels.map((label: string) => (
                                            <span key={label} className="text-xs bg-muted px-1.5 py-0.5 rounded">{label}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Releases */}
                      {githubStats.releases.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Releases</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {githubStats.releases.map((release) => (
                                <div key={release.tag} className="p-3 border rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{release.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {release.tag} • {new Date(release.published_at).toLocaleDateString('pt-BR')}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      {release.draft && (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Draft</span>
                                      )}
                                      {release.prerelease && (
                                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Pre-release</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Branches */}
                      {githubStats.branches && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Branches</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="text-xl font-semibold">{githubStats.branches.total}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Protegidas</p>
                                <p className="text-xl font-semibold">{githubStats.branches.protected}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Padrão</p>
                                <p className="text-lg font-semibold">{githubStats.branches.default}</p>
                              </div>
                            </div>
                            {githubStats.branches.list.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold mb-2">Lista de Branches</p>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                  {githubStats.branches.list.map((branch) => (
                                    <div key={branch.name} className="p-2 border rounded text-sm flex items-center justify-between">
                                      <span>{branch.name}</span>
                                      {branch.protected && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Protegida</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground p-4 border rounded-md text-center">
              Conecte o GitHub acima para vincular repositórios aos projetos
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
