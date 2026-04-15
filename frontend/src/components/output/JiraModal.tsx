import { useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useJira } from '../../hooks/useJira';
import type { TemplateField, FormValues } from '../../types';

const selectClass =
  'w-full px-3 py-2 text-sm bg-white/[0.06] border border-white/10 rounded-lg text-white/80 focus:outline-none focus:border-white/25 focus:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed appearance-none';

const inputClass =
  'w-full px-3 py-2 text-sm bg-white/[0.06] border border-white/10 rounded-lg text-white/80 placeholder-white/30 focus:outline-none focus:border-white/25 focus:bg-white/[0.08]';

const primaryBtn =
  'flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#0052CC] text-white hover:bg-[#0065FF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

const ghostBtn =
  'px-4 py-2 text-sm font-medium rounded-lg bg-white/[0.06] text-white/60 hover:bg-white/[0.10] hover:text-white border border-white/10 transition-colors';

function JiraLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
      <path
        d="M15.814 1.977L8.35 9.44a1.09 1.09 0 000 1.54l3.317 3.317 5.515-5.515a1.09 1.09 0 011.54 0l5.515 5.515 3.317-3.317a1.09 1.09 0 000-1.54L20.07 1.977a2.96 2.96 0 00-4.256 0z"
        fill="#2684FF"
      />
      <path
        d="M15.814 16.043L10.3 21.558a1.09 1.09 0 000 1.54l5.514 5.515a2.96 2.96 0 004.256 0l5.514-5.515a1.09 1.09 0 000-1.54l-5.514-5.515a1.09 1.09 0 00-1.256 0z"
        fill="#2684FF"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function JiraModal({
  isOpen,
  onClose,
  report,
  fields,
  formValues,
}: {
  isOpen: boolean;
  onClose: () => void;
  report: string;
  fields: TemplateField[];
  formValues: FormValues;
}) {
  const jira = useJira(report, fields, formValues);

  // Load projects when the modal opens and user is connected
  useEffect(() => {
    if (isOpen && jira.connected && jira.projects.length === 0) {
      jira.loadProjects();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, jira.connected]);

  function handleClose() {
    if (!jira.createdIssue) jira.reset();
    onClose();
  }

  const descriptionPreview = report.slice(0, 400) + (report.length > 400 ? '…' : '');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Jira Issue">
      {/* ── Not connected ── */}
      {!jira.connected && (
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#0052CC]/10 border border-[#0052CC]/20 flex items-center justify-center">
            <JiraLogo />
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Connect your Jira account</p>
            <p className="text-xs text-white/40 mt-1 max-w-xs">
              Authenticate with Atlassian to create issues directly from BugScribe.
            </p>
          </div>
          <button onClick={jira.connectJira} className={primaryBtn}>
            <JiraLogo />
            Connect Jira
          </button>
        </div>
      )}

      {/* ── Connected: issue creation form ── */}
      {jira.connected && !jira.createdIssue && (
        <div className="flex flex-col gap-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-[#0052CC]/10 flex items-center justify-center">
                <JiraLogo />
              </div>
              <span className="text-xs text-white/40">Connected</span>
            </div>
            <button
              onClick={jira.disconnectJira}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Disconnect
            </button>
          </div>

          {/* Project */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50">Project</label>
            {jira.isLoadingProjects ? (
              <div className="flex items-center gap-2 text-xs text-white/40 py-2">
                <Spinner /> Loading projects…
              </div>
            ) : (
              <select
                className={selectClass}
                value={jira.selectedProjectId ?? ''}
                onChange={(e) => e.target.value && jira.selectProject(e.target.value)}
              >
                <option value="" disabled>Select a project</option>
                {jira.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Issue Type */}
          {jira.selectedProjectId && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">Issue Type</label>
              {jira.isLoadingIssueTypes ? (
                <div className="flex items-center gap-2 text-xs text-white/40 py-2">
                  <Spinner /> Loading issue types…
                </div>
              ) : (
                <select
                  className={selectClass}
                  value={jira.selectedIssueTypeId ?? ''}
                  onChange={(e) => e.target.value && jira.selectIssueType(e.target.value)}
                >
                  <option value="" disabled>Select issue type</option>
                  {jira.issueTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Summary + Description (shown once issue type is selected) */}
          {jira.selectedIssueTypeId && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">
                  Summary
                  <span className="ml-1 text-white/25 font-normal">(editable)</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={jira.summary}
                  onChange={(e) => jira.setSummary(e.target.value)}
                  placeholder="Issue summary…"
                  maxLength={255}
                />
                <span className="text-xs text-white/25 text-right">{jira.summary.length}/255</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Description preview</label>
                <div className="px-3 py-2.5 text-xs text-white/40 bg-white/[0.03] border border-white/[0.06] rounded-lg leading-relaxed whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                  {descriptionPreview}
                </div>
                <p className="text-xs text-white/25">
                  Full generated report will be sent as the description.
                </p>
              </div>
            </>
          )}

          {/* Error */}
          {jira.error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {jira.error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={handleClose} className={ghostBtn}>Cancel</button>
            <button
              onClick={jira.createIssue}
              disabled={!jira.selectedProjectId || !jira.selectedIssueTypeId || !jira.summary.trim() || jira.isCreating}
              className={primaryBtn}
            >
              {jira.isCreating ? (
                <><Spinner /> Creating…</>
              ) : (
                <><JiraLogo /> Create in Jira</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Success state ── */}
      {jira.connected && jira.createdIssue && (
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/90">Issue created!</p>
            <p className="text-xs text-white/40 mt-1">
              <span className="font-mono text-white/60">{jira.createdIssue.key}</span> was added to Jira.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={jira.createdIssue.url}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryBtn}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in Jira
            </a>
            <button onClick={handleClose} className={ghostBtn}>Close</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
