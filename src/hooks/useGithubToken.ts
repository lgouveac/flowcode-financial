import { useState, useEffect } from 'react';

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  description: string;
  private: boolean;
  html_url: string;
}

export function useGithubToken() {
  const [token, setToken] = useState<string | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('github_pat');
    if (savedToken) {
      setToken(savedToken);
      fetchRepos(savedToken).catch(err => {
        console.error('Erro ao buscar repositórios com token salvo:', err);
        // Se o token salvo for inválido, remover
        if (err.message?.includes('inválido') || err.message?.includes('401')) {
          localStorage.removeItem('github_pat');
          localStorage.removeItem('github_repos');
          setToken(null);
        }
      });
    }
  }, []);

  const setGithubToken = async (newToken: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validar token testando uma requisição
      const testResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      if (!testResponse.ok) {
        if (testResponse.status === 401) {
          throw new Error('Token inválido. Verifique se o token está correto e tem as permissões necessárias (scope: repo).');
        }
        throw new Error(`Erro ao validar token: ${testResponse.statusText}`);
      }

      const userData = await testResponse.json();
      console.log('✅ Usuário autenticado:', userData.login);

      setToken(newToken);
      localStorage.setItem('github_pat', newToken);
      await fetchRepos(newToken);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchRepos = async (githubToken: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const allRepos: GitHubRepo[] = [];
      let page = 1;
      let hasMore = true;
      const maxPages = 20; // Limitar a 20 páginas (2000 repositórios)

      console.log('🔄 Iniciando busca de repositórios...');

      while (hasMore && page <= maxPages) {
        // Buscar TODOS os tipos de repositórios
        const response = await fetch(
          `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
          {
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'X-GitHub-Api-Version': '2022-11-28'
            }
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erro na resposta do GitHub:', response.status, errorText);
          
          if (response.status === 401) {
            localStorage.removeItem('github_pat');
            localStorage.removeItem('github_repos');
            setToken(null);
            throw new Error('Token inválido ou expirado. Por favor, insira um novo token.');
          }
          if (response.status === 403) {
            throw new Error('Token não tem permissão para listar repositórios. Verifique se o token tem o scope "repo".');
          }
          throw new Error(`Erro ao buscar repositórios: ${response.statusText}`);
        }

        const pageRepos = await response.json();
        console.log(`📦 Página ${page}: ${pageRepos.length} repositórios encontrados`);
        
        if (pageRepos.length === 0) {
          hasMore = false;
          break;
        }

        allRepos.push(...pageRepos);
        hasMore = pageRepos.length === 100;
        page++;
      }

      console.log(`✅ Total de repositórios encontrados: ${allRepos.length}`);
      
      // Ordenar por nome para facilitar busca
      allRepos.sort((a, b) => a.full_name.localeCompare(b.full_name));
      
      setRepos(allRepos);
      localStorage.setItem('github_repos', JSON.stringify(allRepos));
      
      return allRepos;
    } catch (err: any) {
      console.error('❌ Erro ao buscar repositórios:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeToken = () => {
    localStorage.removeItem('github_pat');
    localStorage.removeItem('github_repos');
    setToken(null);
    setRepos([]);
    setError(null);
  };

  return {
    token,
    repos,
    loading,
    error,
    isAuthenticated: !!token,
    setGithubToken,
    removeToken,
    refreshRepos: () => token && fetchRepos(token)
  };
}

