#!/usr/bin/env node

/**
 * Bug Analyzer Agent
 *
 * Listens for new bug reports via Supabase Realtime.
 * When a bug arrives:
 * 1. Fetches bug details + attachments
 * 2. Finds the project's GitHub repo
 * 3. Clones/pulls the repo
 * 4. Runs Claude Code to analyze and fix the bug
 * 5. Creates a branch, commits, opens a PR
 * 6. Posts the PR link as a comment on the task
 */

import { createClient } from '@supabase/supabase-js';
import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

// ── Config ──
const SUPABASE_URL = 'https://itlpvpdwgiwbdpqheemw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bHB2cGR3Z2l3YmRwcWhlZW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTA5NzEsImV4cCI6MjA1NTc2Njk3MX0.gljQ6JAfbMzP-cbA68Iz21vua9YqAqVQgpB-eLk6nAg';
const REPOS_DIR = path.join(process.env.HOME, '.flowcode-repos');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Ensure repos directory exists
if (!existsSync(REPOS_DIR)) mkdirSync(REPOS_DIR, { recursive: true });

// ── Helpers ──

function log(msg) {
  const ts = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${ts}] ${msg}`);
}

function exec(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', ...opts }).trim();
}

async function fetchBugDetails(taskId) {
  const { data: task, error } = await supabase
    .from('project_tasks')
    .select('*, project:projetos(id, name, github_repo_url, github_repo_full_name)')
    .eq('id', taskId)
    .single();

  if (error) throw new Error(`Failed to fetch task: ${error.message}`);

  // Fetch attachments
  const { data: attachments } = await supabase
    .from('task_attachments')
    .select('*')
    .eq('task_id', taskId);

  // Fetch comments
  const { data: comments } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  return { ...task, attachments: attachments || [], comments: comments || [] };
}

function getRepoPath(repoFullName) {
  return path.join(REPOS_DIR, repoFullName.replace('/', '_'));
}

function cloneOrPull(repoUrl, repoFullName) {
  const repoPath = getRepoPath(repoFullName);

  if (existsSync(path.join(repoPath, '.git'))) {
    log(`Pulling latest for ${repoFullName}...`);
    exec('git checkout main 2>/dev/null || git checkout master', { cwd: repoPath });
    exec('git pull --ff-only', { cwd: repoPath });
  } else {
    log(`Cloning ${repoFullName}...`);
    exec(`git clone ${repoUrl} "${repoPath}"`);
  }

  return repoPath;
}

function createBranch(repoPath, taskId) {
  const branchName = `fix/bug-${taskId.slice(0, 8)}`;
  try {
    exec(`git checkout -b ${branchName}`, { cwd: repoPath });
  } catch {
    // Branch might already exist
    exec(`git checkout ${branchName}`, { cwd: repoPath });
  }
  return branchName;
}

function buildPrompt(bug) {
  const parts = [
    `You are fixing a bug reported by a client.`,
    ``,
    `## Bug Report`,
    `**Title:** ${bug.name}`,
  ];

  if (bug.description) parts.push(`**Description:** ${bug.description}`);
  if (bug.reported_url) parts.push(`**URL where found:** ${bug.reported_url}`);
  if (bug.reported_view) parts.push(`**User view/role:** ${bug.reported_view}`);
  if (bug.reported_by_name) parts.push(`**Reported by:** ${bug.reported_by_name}`);

  if (bug.attachments.length > 0) {
    parts.push(``, `## Attachments`);
    bug.attachments.forEach(a => {
      parts.push(`- [${a.file_name}](${a.file_url}) (${a.file_type})`);
    });
  }

  if (bug.comments.length > 0) {
    parts.push(``, `## Comments from reporter`);
    bug.comments.forEach(c => {
      parts.push(`- ${c.content}`);
    });
  }

  parts.push(
    ``,
    `## Instructions`,
    `1. Analyze the codebase to understand the project structure`,
    `2. Find the code related to this bug based on the URL, description and screenshots`,
    `3. Fix the bug with minimal changes`,
    `4. Do NOT modify unrelated code`,
    `5. Create a commit with a clear message in Portuguese describing the fix`,
    `6. Be concise — fix only what's broken`,
  );

  return parts.join('\n');
}

function runClaudeCode(repoPath, prompt) {
  return new Promise((resolve, reject) => {
    log('Running Claude Code agent...');

    const proc = spawn('claude', [
      '--print',
      '--dangerously-skip-permissions',
      '-p', prompt,
    ], {
      cwd: repoPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        log(`Claude exited with code ${code}`);
        log(`stderr: ${stderr.slice(-500)}`);
      }
      resolve(stdout);
    });

    proc.on('error', reject);

    // 10 minute timeout
    setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Claude Code timed out after 10 minutes'));
    }, 10 * 60 * 1000);
  });
}

function pushAndCreatePR(repoPath, branchName, bug) {
  // Check if there are any commits on the branch
  const mainBranch = exec('git rev-parse --abbrev-ref HEAD@{upstream} 2>/dev/null || echo main', { cwd: repoPath }).split('/').pop();

  const diff = exec(`git diff ${mainBranch}..HEAD --stat 2>/dev/null || echo ""`, { cwd: repoPath });
  if (!diff) {
    log('No changes made by Claude. Skipping PR.');
    return null;
  }

  log('Pushing branch...');
  exec(`git push -u origin ${branchName}`, { cwd: repoPath });

  log('Creating PR...');
  const title = `fix: ${bug.name}`.slice(0, 70);
  const body = [
    `## Bug Report`,
    `**Reportado por:** ${bug.reported_by_name || 'Cliente'}`,
    bug.reported_url ? `**URL:** ${bug.reported_url}` : '',
    bug.reported_view ? `**Visão:** ${bug.reported_view}` : '',
    ``,
    `**Descrição:** ${bug.description || bug.name}`,
    ``,
    `---`,
    `*Correção sugerida automaticamente por AI. Requer aprovação antes do merge.*`,
  ].filter(Boolean).join('\n');

  const prUrl = exec(
    `gh pr create --title "${title}" --body "${body.replace(/"/g, '\\"')}" --base main --head ${branchName}`,
    { cwd: repoPath }
  );

  return prUrl;
}

async function postCommentOnTask(taskId, prUrl, claudeOutput) {
  const summary = claudeOutput.slice(0, 500);
  const content = prUrl
    ? `**Análise automática concluída**\n\nPR com sugestão de correção: ${prUrl}\n\n**Resumo da análise:**\n${summary}`
    : `**Análise automática concluída**\n\nO agente analisou o bug mas não encontrou alterações necessárias no código.\n\n**Resumo:**\n${summary}`;

  await supabase.from('task_comments').insert({
    task_id: taskId,
    content,
    is_public: false,
  });
}

// ── Main handler ──

async function handleNewBug(taskId) {
  try {
    log(`New bug received: ${taskId}`);

    // 1. Fetch bug details
    const bug = await fetchBugDetails(taskId);
    log(`Bug: "${bug.name}" | Project: ${bug.project?.name}`);

    // 2. Check if project has GitHub repo
    if (!bug.project?.github_repo_url) {
      log(`Project has no GitHub repo configured. Skipping.`);
      await supabase.from('task_comments').insert({
        task_id: taskId,
        content: '**Análise automática:** Projeto sem repositório GitHub configurado. Análise manual necessária.',
        is_public: false,
      });
      return;
    }

    const repoUrl = bug.project.github_repo_url;
    const repoFullName = bug.project.github_repo_full_name;

    // 3. Clone/pull repo
    const repoPath = cloneOrPull(repoUrl, repoFullName);

    // 4. Create branch
    const branchName = createBranch(repoPath, taskId);
    log(`Branch: ${branchName}`);

    // 5. Run Claude Code
    const prompt = buildPrompt(bug);
    const claudeOutput = await runClaudeCode(repoPath, prompt);

    // 6. Push and create PR
    const prUrl = pushAndCreatePR(repoPath, branchName, bug);

    // 7. Post comment on task
    await postCommentOnTask(taskId, prUrl, claudeOutput);

    if (prUrl) {
      log(`PR created: ${prUrl}`);
    } else {
      log(`Analysis complete, no code changes needed.`);
    }

  } catch (error) {
    log(`Error processing bug ${taskId}: ${error.message}`);
    // Post error as comment
    await supabase.from('task_comments').insert({
      task_id: taskId,
      content: `**Erro na análise automática:** ${error.message}`,
      is_public: false,
    }).catch(() => {});
  }
}

// ── Realtime listener ──

function startListening() {
  log('Bug Analyzer Agent started. Listening for new bugs...');
  log(`Repos directory: ${REPOS_DIR}`);

  const channel = supabase
    .channel('bug-watcher')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'project_tasks',
        filter: 'task_type=eq.bug',
      },
      (payload) => {
        log('Bug detected via Realtime!');
        handleNewBug(payload.new.id);
      }
    )
    .subscribe((status) => {
      log(`Realtime subscription: ${status}`);
    });

  // Graceful shutdown
  process.on('SIGINT', () => {
    log('Shutting down...');
    supabase.removeChannel(channel);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('Shutting down...');
    supabase.removeChannel(channel);
    process.exit(0);
  });
}

startListening();
