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
          'Authorization': `token ${newToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!testResponse.ok) {
        if (testResponse.status === 401) {
          throw new Error('Token inválido. Verifique se o token está correto e tem as permissões necessárias (scope: repo).');
        }
        throw new Error(`Erro ao validar token: ${testResponse.statusText}`);
      }

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

      while (hasMore) {
        const response = await fetch(
          `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('github_pat');
            localStorage.removeItem('github_repos');
            setToken(null);
            throw new Error('Token inválido. Por favor, insira um novo token.');
          }
          throw new Error(`Erro ao buscar repositórios: ${response.statusText}`);
        }

        const pageRepos = await response.json();
        allRepos.push(...pageRepos);
        hasMore = pageRepos.length === 100;
        page++;
      }

      setRepos(allRepos);
      localStorage.setItem('github_repos', JSON.stringify(allRepos));
    } catch (err: any) {
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

