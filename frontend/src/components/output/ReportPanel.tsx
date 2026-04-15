import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from './CopyButton';
import { JiraModal } from './JiraModal';
import { markdownToPlainText } from '../../lib/markdownToPlainText';
import { translateReport } from '../../lib/api';
import type { TemplateField, FormValues } from '../../types';

// Remove markdown sections whose body is empty, whitespace-only, or "not specified"
function removeEmptySections(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      const bodyLines: string[] = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith('## ') && !lines[j].startsWith('# ')) {
        bodyLines.push(lines[j]);
        j++;
      }

      const bodyText = bodyLines.join('\n').trim();
      const isEmptyBody =
        bodyText === '' ||
        /^not specified\.?$/i.test(bodyText) ||
        /^n\/a\.?$/i.test(bodyText) ||
        /^none\.?$/i.test(bodyText);

      if (!isEmptyBody) {
        result.push(line);
        result.push(...bodyLines);
      }
      i = j;
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join('\n');
}

const toolbarBtn =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-white/[0.06] text-white/60 hover:bg-white/[0.10] hover:text-white border border-white/10';

export function ReportPanel({
  report,
  isLoading,
  error,
  onSave,
  onSaveReport,
  isAlreadySaved = false,
  fields = [],
  formValues = {},
}: {
  report: string;
  isLoading: boolean;
  error: string | null;
  onSave: (updated: string) => void;
  onSaveReport?: () => Promise<void>;
  isAlreadySaved?: boolean;
  fields?: TemplateField[];
  formValues?: FormValues;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [jiraModalOpen, setJiraModalOpen] = useState(false);

  const [translatedReport, setTranslatedReport] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showHebrew, setShowHebrew] = useState(false);

  async function handleSaveReport() {
    if (!onSaveReport) return;
    setIsSaving(true);
    await onSaveReport();
    setIsSaving(false);
    setIsSaved(true);
  }

  useEffect(() => {
    if (report) {
      setIsEditing(false);
      setTranslatedReport('');
      setShowHebrew(false);
      setIsSaved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report]);

  function handleEdit() {
    setEditedReport(showHebrew ? translatedReport : report);
    setIsEditing(true);
  }

  function handleSave() {
    onSave(editedReport);
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setIsEditing(false);
  }

  function handleToggleLanguage() {
    if (showHebrew) {
      setShowHebrew(false);
      return;
    }

    if (translatedReport) {
      setShowHebrew(true);
      return;
    }

    setIsTranslating(true);
    setShowHebrew(true);
    let accumulated = '';
    translateReport(
      removeEmptySections(report),
      'Hebrew',
      (delta) => {
        accumulated += delta;
        setTranslatedReport(accumulated);
      },
      () => setIsTranslating(false),
      () => {
        setIsTranslating(false);
        setShowHebrew(false);
      }
    );
  }

  const previewReport = removeEmptySections(report);
  const activeReport = showHebrew ? removeEmptySections(translatedReport) : previewReport;
  const plainTextReport = markdownToPlainText(activeReport);

  // Empty state
  if (!report && !isLoading && !error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4">
          <svg className="h-6 w-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-white/30">No report generated yet</p>
        <p className="text-xs text-white/20 mt-1 max-w-[200px]">
          Fill in the form or paste your notes, then click "Analyze" to generate a structured bug report.
        </p>
      </div>
    );
  }

  // Error state
  if (error && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-red-400">Analysis failed</p>
        <p className="text-xs text-white/40 mt-1">{error}</p>
        <p className="text-xs text-white/25 mt-2">Check that your API key is set in backend/.env</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-white/10 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            Generated Report
          </span>
          {(isLoading || isTranslating) && (
            <span className="inline-flex items-center gap-1 text-xs text-cyan-400">
              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {isTranslating ? 'Translating...' : 'Writing...'}
            </span>
          )}
        </div>

        {report && !isLoading && (
          <div className="flex items-center flex-wrap justify-end gap-2">
            {isEditing ? (
              <>
                <button onClick={handleCancelEdit} className={toolbarBtn}>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 text-[#05080f] hover:bg-cyan-400 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
              </>
            ) : (
              <>
                <button onClick={handleEdit} className={toolbarBtn}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={handleToggleLanguage}
                  disabled={isTranslating}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    showHebrew
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/25'
                      : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.10] hover:text-white border border-white/10'
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  {showHebrew ? 'English' : 'עברית'}
                </button>
                {onSaveReport && (
                  isAlreadySaved || isSaved ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] text-white/30 border border-white/[0.07] cursor-default select-none">
                      <svg className="h-3.5 w-3.5 text-cyan-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
                    </span>
                  ) : (
                    <button
                      onClick={handleSaveReport}
                      disabled={isSaving}
                      className={`${toolbarBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                  )
                )}
                <CopyButton text={plainTextReport} />
                <button
                  onClick={() => setJiraModalOpen(true)}
                  className={toolbarBtn}
                  title="Create issue in Jira"
                >
                  <svg viewBox="0 0 32 32" className="h-3.5 w-3.5" fill="none">
                    <path d="M15.814 1.977L8.35 9.44a1.09 1.09 0 000 1.54l3.317 3.317 5.515-5.515a1.09 1.09 0 011.54 0l5.515 5.515 3.317-3.317a1.09 1.09 0 000-1.54L20.07 1.977a2.96 2.96 0 00-4.256 0z" fill="currentColor" />
                    <path d="M15.814 16.043L10.3 21.558a1.09 1.09 0 000 1.54l5.514 5.515a2.96 2.96 0 004.256 0l5.514-5.515a1.09 1.09 0 000-1.54l-5.514-5.515a1.09 1.09 0 00-1.256 0z" fill="currentColor" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <JiraModal
        isOpen={jiraModalOpen}
        onClose={() => setJiraModalOpen(false)}
        report={activeReport}
        fields={fields}
        formValues={formValues}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5" dir={showHebrew ? 'rtl' : 'ltr'}>
        {isEditing ? (
          <textarea
            value={editedReport}
            onChange={(e) => setEditedReport(e.target.value)}
            className="w-full h-full min-h-[400px] text-sm font-mono bg-transparent border-none outline-none resize-none text-white/80 leading-relaxed"
            autoFocus
          />
        ) : (
          <>
            <div className="prose prose-sm max-w-none prose-dark">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside pl-5 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{children}</li>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = className?.startsWith('language-');
                    return isBlock ? (
                      <code className={`${className ?? ''} block overflow-x-auto`}>{children}</code>
                    ) : (
                      <code style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }} className="px-1 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }) => (
                    <h1 style={{ color: 'rgba(255,255,255,0.9)' }} className="text-xl font-bold mt-0 mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 style={{ color: 'rgba(255,255,255,0.4)', borderBottomColor: 'rgba(255,255,255,0.07)' }} className="text-sm font-semibold uppercase tracking-wider mt-6 mb-2 border-b pb-1">
                      {children}
                    </h2>
                  ),
                }}
              >
                {isLoading ? report : activeReport}
              </ReactMarkdown>
              {(isLoading || isTranslating) && (
                <span className="inline-block w-0.5 h-4 bg-cyan-400 animate-pulse ml-0.5" />
              )}
            </div>

          </>
        )}
      </div>
    </div>
  );
}
