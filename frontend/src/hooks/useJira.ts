import { useState, useEffect, useCallback } from 'react';
import {
  checkJiraStatus,
  fetchJiraProjects,
  fetchIssueTypes,
  createJiraIssue,
  disconnectJira,
  type JiraProject,
  type JiraIssueType,
  type CreatedIssue,
} from '../lib/jiraApi';
import type { TemplateField, FormValues } from '../types';

export interface UseJiraReturn {
  connected: boolean;
  projects: JiraProject[];
  issueTypes: JiraIssueType[];
  selectedProjectId: string | null;
  selectedIssueTypeId: string | null;
  summary: string;
  isLoadingProjects: boolean;
  isLoadingIssueTypes: boolean;
  isCreating: boolean;
  createdIssue: CreatedIssue | null;
  error: string | null;
  connectJira: () => void;
  disconnectJira: () => Promise<void>;
  loadProjects: () => Promise<void>;
  selectProject: (id: string) => Promise<void>;
  selectIssueType: (id: string) => void;
  setSummary: (s: string) => void;
  createIssue: () => Promise<void>;
  reset: () => void;
}

export function useJira(
  report: string,
  fields: TemplateField[],
  formValues: FormValues
): UseJiraReturn {
  const [connected, setConnected] = useState(false);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedIssueTypeId, setSelectedIssueTypeId] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingIssueTypes, setIsLoadingIssueTypes] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdIssue, setCreatedIssue] = useState<CreatedIssue | null>(null);
  const [error, setError] = useState<string | null>(null);

  // On mount: check connection status + handle post-OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jiraParam = params.get('jira');

    if (jiraParam) {
      // Clean the query param from the URL without a page reload
      params.delete('jira');
      const newSearch = params.toString();
      window.history.replaceState(
        {},
        '',
        newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname
      );
    }

    checkJiraStatus()
      .then(({ connected: c }) => setConnected(c))
      .catch(() => setConnected(false));
  }, []);

  const connectJira = useCallback(() => {
    window.location.href = '/api/jira/auth/connect';
  }, []);

  const handleDisconnect = useCallback(async () => {
    await disconnectJira().catch(() => {});
    setConnected(false);
    setProjects([]);
    setIssueTypes([]);
    setSelectedProjectId(null);
    setSelectedIssueTypeId(null);
  }, []);

  const loadProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    setError(null);
    try {
      const list = await fetchJiraProjects();
      setProjects(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  const selectProject = useCallback(async (id: string) => {
    setSelectedProjectId(id);
    setSelectedIssueTypeId(null);
    setIssueTypes([]);
    setIsLoadingIssueTypes(true);
    setError(null);
    try {
      const types = await fetchIssueTypes(id);
      setIssueTypes(types);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issue types');
    } finally {
      setIsLoadingIssueTypes(false);
    }
  }, []);

  const selectIssueType = useCallback((id: string) => {
    setSelectedIssueTypeId(id);
  }, []);

  const createIssue = useCallback(async () => {
    if (!selectedProjectId || !selectedIssueTypeId) return;
    setIsCreating(true);
    setError(null);
    try {
      const issue = await createJiraIssue({
        projectId: selectedProjectId,
        issueTypeId: selectedIssueTypeId,
        summary,
        report,
        fields,
        formValues,
      });
      setCreatedIssue(issue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Jira issue');
    } finally {
      setIsCreating(false);
    }
  }, [selectedProjectId, selectedIssueTypeId, summary, report, fields, formValues]);

  const reset = useCallback(() => {
    setProjects([]);
    setIssueTypes([]);
    setSelectedProjectId(null);
    setSelectedIssueTypeId(null);
    setSummary('');
    setCreatedIssue(null);
    setError(null);
  }, []);

  // Pre-fill summary when fields/formValues change (or when summary is empty)
  useEffect(() => {
    if (summary) return;
    // Build a quick client-side summary for pre-fill (same logic as backend fallback)
    const titleField = fields.find(
      (f) => f.type !== 'file' && /^(title|summary|name)$/i.test(f.label.trim())
    );
    if (titleField) {
      const val = formValues[titleField.id];
      const text = Array.isArray(val) ? val.join(', ') : (val ?? '');
      if (text.trim()) { setSummary(text.trim().slice(0, 255)); return; }
    }
    const parts: string[] = [];
    for (const field of fields) {
      if (field.type === 'file') continue;
      const val = formValues[field.id];
      const text = Array.isArray(val) ? val.join(', ') : (val ?? '');
      if (text.trim()) {
        parts.push(`${field.label}: ${text.trim()}`);
        if (parts.length >= 3) break;
      }
    }
    if (parts.length) setSummary(parts.join(' — ').slice(0, 255));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, formValues]);

  return {
    connected,
    projects,
    issueTypes,
    selectedProjectId,
    selectedIssueTypeId,
    summary,
    isLoadingProjects,
    isLoadingIssueTypes,
    isCreating,
    createdIssue,
    error,
    connectJira,
    disconnectJira: handleDisconnect,
    loadProjects,
    selectProject,
    selectIssueType,
    setSummary,
    createIssue,
    reset,
  };
}
