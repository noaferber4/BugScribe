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
  report: string;
  fields?: { id: string; label: string; type: string }[];
  formValues?: Record<string, string | string[]>;
}

export interface CreatedIssue {
  key: string;
  url: string;
}

async function jiraFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/jira${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json() as T & { error?: string };

  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed: ${res.status}`);
  }

  return data;
}

export async function checkJiraStatus(): Promise<{ connected: boolean }> {
  return jiraFetch<{ connected: boolean }>('/status');
}

export async function fetchJiraProjects(): Promise<JiraProject[]> {
  const data = await jiraFetch<{ projects: JiraProject[] }>('/projects');
  return data.projects;
}

export async function fetchIssueTypes(projectId: string): Promise<JiraIssueType[]> {
  const data = await jiraFetch<{ issueTypes: JiraIssueType[] }>(
    `/issue-types?projectId=${encodeURIComponent(projectId)}`
  );
  return data.issueTypes;
}

export async function createJiraIssue(payload: CreateIssuePayload): Promise<CreatedIssue> {
  return jiraFetch<CreatedIssue>('/create-issue', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function disconnectJira(): Promise<void> {
  await jiraFetch('/auth/disconnect', { method: 'POST' });
}
