import { Router } from 'express';
import {
  generateSessionId,
  setTokens,
  getTokens,
  deleteTokens,
} from '../lib/jiraTokenStore.js';
import { getProjects, getIssueTypes, createIssue } from '../lib/jiraClient.js';
import { markdownToAdf } from '../lib/adfBuilder.js';
import { buildJiraSummary } from '../lib/jiraSummaryBuilder.js';
import type { TemplateField, FormValues } from '../lib/types.js';

const router = Router();

// Helper: read the jira_session cookie from the request headers.
function getSessionId(cookieHeader: string | undefined): string | undefined {
  return cookieHeader
    ?.split(';')
    .find((c) => c.trim().startsWith('jira_session='))
    ?.split('=')[1]
    ?.trim();
}

// ──────────────────────────────────────────────
// GET /api/jira/auth/connect
// Redirects the browser to the Atlassian OAuth authorization page.
// ──────────────────────────────────────────────
router.get('/auth/connect', (_req, res) => {
  const clientId = process.env.JIRA_CLIENT_ID;
  const redirectUri = process.env.JIRA_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res.status(500).json({ error: 'Jira OAuth is not configured on the server' });
    return;
  }

  const sessionId = generateSessionId();

  const params = new URLSearchParams({
    audience: 'api.atlassian.com',
    client_id: clientId,
    scope: 'read:jira-work write:jira-work offline_access',
    redirect_uri: redirectUri,
    state: sessionId,
    response_type: 'code',
    prompt: 'consent',
  });

  res.redirect(`https://auth.atlassian.com/authorize?${params.toString()}`);
});

// ──────────────────────────────────────────────
// GET /api/jira/auth/callback
// Handles the OAuth redirect from Atlassian.
// ──────────────────────────────────────────────
router.get('/auth/callback', async (req, res) => {
  const { code, state: sessionId, error: oauthError } = req.query as Record<string, string>;
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  if (oauthError || !code || !sessionId) {
    res.redirect(`${frontendUrl}?jira=error&reason=${oauthError ?? 'missing_code'}`);
    return;
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.JIRA_CLIENT_ID!,
        client_secret: process.env.JIRA_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.JIRA_REDIRECT_URI!,
      }).toString(),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    // Fetch accessible Jira cloud sites
    const resourcesRes = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
    });

    if (!resourcesRes.ok) {
      throw new Error(`Failed to fetch Jira resources: ${resourcesRes.status}`);
    }

    const resources = await resourcesRes.json() as { id: string; url: string; name: string }[];

    if (resources.length === 0) {
      res.redirect(`${frontendUrl}?jira=error&reason=no_jira_sites`);
      return;
    }

    // Use the first accessible site (users can expand multi-site support later)
    const site = resources[0];

    await setTokens(sessionId, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      cloudId: site.id,
      cloudUrl: site.url,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    });

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('jira_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.redirect(`${frontendUrl}?jira=connected`);
  } catch (err) {
    console.error('[Jira] OAuth callback error:', err);
    res.redirect(`${frontendUrl}?jira=error&reason=server_error`);
  }
});

// ──────────────────────────────────────────────
// POST /api/jira/auth/disconnect
// Clears stored tokens and the session cookie.
// ──────────────────────────────────────────────
router.post('/auth/disconnect', async (req, res) => {
  const sessionId = getSessionId(req.headers.cookie);
  if (sessionId) {
    await deleteTokens(sessionId).catch(() => {});
  }
  res.clearCookie('jira_session', { path: '/' });
  res.json({ ok: true });
});

// ──────────────────────────────────────────────
// GET /api/jira/status
// Returns whether the current session has a valid Jira connection.
// ──────────────────────────────────────────────
router.get('/status', async (req, res) => {
  const sessionId = getSessionId(req.headers.cookie);
  if (!sessionId) {
    res.json({ connected: false });
    return;
  }
  const tokens = await getTokens(sessionId).catch(() => null);
  res.json({ connected: tokens !== null });
});

// ──────────────────────────────────────────────
// GET /api/jira/projects
// Returns the list of Jira projects for the connected user.
// ──────────────────────────────────────────────
router.get('/projects', async (req, res) => {
  const sessionId = getSessionId(req.headers.cookie);
  if (!sessionId) {
    res.status(401).json({ error: 'Not connected to Jira' });
    return;
  }

  try {
    const projects = await getProjects(sessionId);
    res.json({ projects });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('Not connected') ? 401 : 502;
    res.status(status).json({ error: message });
  }
});

// ──────────────────────────────────────────────
// GET /api/jira/issue-types?projectId=...
// Returns issue types for a given project.
// ──────────────────────────────────────────────
router.get('/issue-types', async (req, res) => {
  const sessionId = getSessionId(req.headers.cookie);
  if (!sessionId) {
    res.status(401).json({ error: 'Not connected to Jira' });
    return;
  }

  const { projectId } = req.query as { projectId?: string };
  if (!projectId) {
    res.status(400).json({ error: 'projectId query parameter is required' });
    return;
  }

  try {
    const issueTypes = await getIssueTypes(sessionId, projectId);
    res.json({ issueTypes });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('Not connected') ? 401 : 502;
    res.status(status).json({ error: message });
  }
});

// ──────────────────────────────────────────────
// POST /api/jira/create-issue
// Creates a Jira issue from the generated bug report.
// Body: { projectId, issueTypeId, summary?, report, fields?, formValues? }
// ──────────────────────────────────────────────
router.post('/create-issue', async (req, res) => {
  const sessionId = getSessionId(req.headers.cookie);
  if (!sessionId) {
    res.status(401).json({ error: 'Not connected to Jira' });
    return;
  }

  const {
    projectId,
    issueTypeId,
    summary: providedSummary,
    report,
    fields,
    formValues,
  } = req.body as {
    projectId: string;
    issueTypeId: string;
    summary?: string;
    report: string;
    fields?: TemplateField[];
    formValues?: FormValues;
  };

  if (!projectId || !issueTypeId || !report) {
    res.status(400).json({ error: 'projectId, issueTypeId, and report are required' });
    return;
  }

  // Use the user-edited summary if provided; otherwise auto-generate from template fields.
  const summary =
    providedSummary?.trim() ||
    buildJiraSummary(fields ?? [], formValues ?? {});

  const description = markdownToAdf(report);

  try {
    const issue = await createIssue(sessionId, {
      projectId,
      issueTypeId,
      summary,
      description,
    });
    res.json(issue);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('Not connected') ? 401 : 502;
    res.status(status).json({ error: message });
  }
});

export default router;
