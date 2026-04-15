import { createClient } from '@supabase/supabase-js';

export interface JiraTokens {
  accessToken: string;
  refreshToken: string;
  cloudId: string;
  cloudUrl: string;
  expiresAt: number; // Date.now() + expires_in * 1000
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for Jira token storage');
  }
  return createClient(url, key);
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export async function setTokens(sessionId: string, tokens: JiraTokens): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('jira_tokens').upsert({
    session_id: sessionId,
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    cloud_id: tokens.cloudId,
    cloud_url: tokens.cloudUrl,
    expires_at: tokens.expiresAt,
  });
  if (error) throw new Error(`Failed to store Jira tokens: ${error.message}`);
}

export async function getTokens(sessionId: string): Promise<JiraTokens | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('jira_tokens')
    .select('access_token, refresh_token, cloud_id, cloud_url, expires_at')
    .eq('session_id', sessionId)
    .single();

  if (error || !data) return null;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    cloudId: data.cloud_id,
    cloudUrl: data.cloud_url,
    expiresAt: data.expires_at,
  };
}

export async function deleteTokens(sessionId: string): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from('jira_tokens').delete().eq('session_id', sessionId);
}
