interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
}

interface GitHubContributor {
  author: {
    login: string;
    avatar_url: string;
  };
  weeks: Array<{
    w: number;
    a: number; // additions
    d: number; // deletions
    c: number; // commits
  }>;
  total: number; // total commits
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  merged_at: string | null;
  closed_at: string | null;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  closed_at: string | null;
  labels: Array<{
    name: string;
    color: string;
  }>;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  author: {
    login: string;
    avatar_url: string;
  };
  draft: boolean;
  prerelease: boolean;
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

interface RepositoryStats {
  // Commits
  totalCommits: number;
  totalPushes: number;
  recentCommits: Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
    additions?: number;
    deletions?: number;
    url?: string;
  }>;
  
  // Contribuidores
  contributors: Array<{
    login: string;
    avatar_url: string;
    commits: number;
    additions: number;
    deletions: number;
  }>;
  
  // Linhas de código
  totalLines: {
    additions: number;
    deletions: number;
    total: number;
  };
  
  // Pull Requests
  pullRequests: {
    total: number;
    open: number;
    closed: number;
    merged: number;
    recent: Array<{
      number: number;
      title: string;
      state: string;
      author: string;
      created_at: string;
      merged_at?: string;
    }>;
  };
  
  // Issues
  issues: {
    total: number;
    open: number;
    closed: number;
    recent: Array<{
      number: number;
      title: string;
      state: string;
      author: string;
      created_at: string;
      labels: string[];
    }>;
  };
  
  // Releases
  releases: Array<{
    tag: string;
    name: string;
    published_at: string;
    author: string;
    draft: boolean;
    prerelease: boolean;
  }>;
  
  // Branches
  branches: {
    total: number;
    default: string;
    protected: number;
    list: Array<{
      name: string;
      protected: boolean;
    }>;
  };
  
  // Estatísticas do repositório
  repository: {
    stars: number;
    forks: number;
    watchers: number;
    language: string;
    size: number; // em KB
    created_at: string;
    updated_at: string;
    pushed_at: string;
  };
  
  lastSyncAt: string;
}

export async function fetchRepositoryStats(
  repoFullName: string,
  githubToken: string
): Promise<RepositoryStats> {
  const [owner, repo] = repoFullName.split('/');
  
  // Buscar informações básicas do repositório
  const repoResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!repoResponse.ok) {
    throw new Error(`Erro ao buscar repositório: ${repoResponse.statusText}`);
  }

  const repoData = await repoResponse.json();

  // Buscar commits recentes (últimos 30 dias)
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 30);
  const since = sinceDate.toISOString();

  // Buscar commits com estatísticas
  const commitsResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?since=${since}&per_page=100`,
    {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!commitsResponse.ok) {
    throw new Error(`Erro ao buscar commits: ${commitsResponse.statusText}`);
  }

  const commits: GitHubCommit[] = await commitsResponse.json();

  // Buscar estatísticas de contribuidores
  const contributorsResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/stats/contributors`,
    {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  let contributors: GitHubContributor[] = [];
  if (contributorsResponse.ok) {
    contributors = await contributorsResponse.json();
  }

  // Buscar Pull Requests
  const prsResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100&sort=updated`,
    {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  let pullRequests: GitHubPullRequest[] = [];
  if (prsResponse.ok) {
    pullRequests = await prsResponse.json();
  }

  // Buscar Issues
  const issuesResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100&sort=updated`,
    {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  let issues: GitHubIssue[] = [];
  if (issuesResponse.ok) {
    issues = await issuesResponse.json();
  }

  // Buscar Releases
  const releasesResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases?per_page=20`,
    {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  let releases: GitHubRelease[] = [];
  if (releasesResponse.ok) {
    releases = await releasesResponse.json();
  }

  // Buscar Branches
  const branchesResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
    {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  let branches: GitHubBranch[] = [];
  if (branchesResponse.ok) {
    branches = await branchesResponse.json();
  }

  // Processar contribuidores
  const contributorMap = new Map<string, {
    login: string;
    avatar_url: string;
    commits: number;
    additions: number;
    deletions: number;
  }>();

  contributors.forEach((contributor) => {
    const login = contributor.author.login;
    const avatar_url = contributor.author.avatar_url;
    let totalAdditions = 0;
    let totalDeletions = 0;

    contributor.weeks.forEach((week) => {
      totalAdditions += week.a;
      totalDeletions += week.d;
    });

    contributorMap.set(login, {
      login,
      avatar_url,
      commits: contributor.total,
      additions: totalAdditions,
      deletions: totalDeletions,
    });
  });

  // Processar commits recentes
  const recentCommits = [];
  let totalAdditions = 0;
  let totalDeletions = 0;

  for (const commit of commits.slice(0, 30)) {
    const author = commit.author?.login || commit.commit.author.name;
    const commitData = {
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message.split('\n')[0],
      author,
      date: commit.commit.author.date,
      additions: commit.stats?.additions || 0,
      deletions: commit.stats?.deletions || 0,
      url: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
    };

    recentCommits.push(commitData);
    totalAdditions += commitData.additions;
    totalDeletions += commitData.deletions;

    // Atualizar estatísticas do contribuidor
    if (commit.author) {
      const existing = contributorMap.get(commit.author.login);
      if (existing) {
        existing.commits += 1;
        existing.additions += commitData.additions;
        existing.deletions += commitData.deletions;
      } else {
        contributorMap.set(commit.author.login, {
          login: commit.author.login,
          avatar_url: commit.author.avatar_url,
          commits: 1,
          additions: commitData.additions,
          deletions: commitData.deletions,
        });
      }
    }
  }

  // Processar Pull Requests
  const prStats = {
    total: pullRequests.length,
    open: pullRequests.filter(pr => pr.state === 'open').length,
    closed: pullRequests.filter(pr => pr.state === 'closed' && !pr.merged_at).length,
    merged: pullRequests.filter(pr => pr.merged_at !== null).length,
    recent: pullRequests.slice(0, 10).map(pr => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      author: pr.user.login,
      created_at: pr.created_at,
      merged_at: pr.merged_at || undefined,
    })),
  };

  // Processar Issues (filtrar PRs que aparecem como issues)
  const realIssues = issues.filter(issue => !issue.pull_request);
  const issueStats = {
    total: realIssues.length,
    open: realIssues.filter(issue => issue.state === 'open').length,
    closed: realIssues.filter(issue => issue.state === 'closed').length,
    recent: realIssues.slice(0, 10).map(issue => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      author: issue.user.login,
      created_at: issue.created_at,
      labels: issue.labels.map(label => label.name),
    })),
  };

  // Processar Releases
  const processedReleases = releases.map(release => ({
    tag: release.tag_name,
    name: release.name || release.tag_name,
    published_at: release.published_at,
    author: release.author.login,
    draft: release.draft,
    prerelease: release.prerelease,
  }));

  // Processar Branches
  const branchStats = {
    total: branches.length,
    default: repoData.default_branch,
    protected: branches.filter(b => b.protected).length,
    list: branches.map(b => ({
      name: b.name,
      protected: b.protected,
    })),
  };

  return {
    totalCommits: commits.length,
    totalPushes: commits.length,
    recentCommits,
    contributors: Array.from(contributorMap.values()).sort((a, b) => b.commits - a.commits),
    totalLines: {
      additions: totalAdditions,
      deletions: totalDeletions,
      total: totalAdditions + totalDeletions,
    },
    pullRequests: prStats,
    issues: issueStats,
    releases: processedReleases,
    branches: branchStats,
    repository: {
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      watchers: repoData.watchers_count || 0,
      language: repoData.language || 'N/A',
      size: repoData.size || 0,
      created_at: repoData.created_at,
      updated_at: repoData.updated_at,
      pushed_at: repoData.pushed_at,
    },
    lastSyncAt: new Date().toISOString(),
  };
}

