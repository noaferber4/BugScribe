import { getTokens, setTokens, type JiraTokens } from './jiraTokenStore.js';

export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
}

export interface CreateIssuePayload {
  projectId: string;
  issueTypeId: string;
  summary: string;
  description: AdfDocument;
}

export interface AdfDocument {
  version: 1;
  type: 'doc';
  content: object[];
}

// Refreshes the access token using the refresh token and updates the store.
async function refreshTokens(sessionId: string, tokens: JiraTokens): Promise<JiraTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.JIRA_CLIENT_ID!,
    client_secret: process.env.JIRA_CLIENT_SECRET!,
    refresh_token: tokens.refreshToken,
  });

  const res = await fetch('https://auth.atlassian.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error('Failed to refresh Jira token — user must reconnect');
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const refreshed: JiraTokens = {
    ...tokens,
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  await setTokens(sessionId, refreshed);
  return refreshed;
}

// Returns valid tokens, refreshing if the access token is expired (with a 60s buffer).
async function getValidTokens(sessionId: string): Promise<JiraTokens> {
  const tokens = await getTokens(sessionId);
  if (!tokens) throw new Error('Not connected to Jira');

  if (Date.now() >= tokens.expiresAt - 60_000) {
    return refreshTokens(sessionId, tokens);
  }
  return tokens;
}

async function jiraFetch<T>(
  sessionId: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const tokens = await getValidTokens(sessionId);
  const url = `https://api.atlassian.com/ex/jira/${tokens.cloudId}/rest/api/3${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Jira API error ${res.status}`;
    try {
      const body = await res.json() as { errorMessages?: string[]; errors?: Record<string, string> };
      const msgs = body.errorMessages ?? [];
      const errs = Object.values(body.errors ?? {});
      if (msgs.length || errs.length) message = [...msgs, ...errs].join('; ');
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function getProjects(sessionId: string): Promise<JiraProject[]> {
  const data = await jiraFetch<{ values: { id: string; key: string; name: string }[] }>(
    sessionId,
    '/project/search?maxResults=100&orderBy=NAME'
  );
  return data.values.map(({ id, key, name }) => ({ id, key, name }));
}

export async function getIssueTypes(sessionId: string, projectId: string): Promise<JiraIssueType[]> {
  const data = await jiraFetch<{ issueTypes: { id: string; name: string; subtask: boolean }[] }>(
    sessionId,
    `/project/${projectId}`
  );
  // Exclude subtask types as they require a parent issue
  return data.issueTypes
    .filter((t) => !t.subtask)
    .map(({ id, name }) => ({ id, name }));
}

export async function createIssue(
  sessionId: string,
  payload: CreateIssuePayload
): Promise<{ key: string; url: string }> {
  const tokens = await getValidTokens(sessionId);

  const body = {
    fields: {
      project: { id: payload.projectId },
      issuetype: { id: payload.issueTypeId },
      summary: payload.summary,
      description: payload.description,
    },
  };

  const data = await jiraFetch<{ key: string; self: string }>(sessionId, '/issue', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const url = `${tokens.cloudUrl}/browse/${data.key}`;
  return { key: data.key, url };
}
