import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from './CopyButton';
import { markdownToPlainText } from '../../lib/markdownToPlainText';
import { translateReport } from '../../lib/api';

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

export function ReportPanel({
  report,
  isLoading,
  error,
  onSave,
  onSaveReport,
  missingFields,
}: {
  report: string;
  isLoading: boolean;
  error: string | null;
  onSave: (updated: string) => void;
  onSaveReport?: () => Promise<void>;
  missingFields?: string[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Translation state
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

  // When a new report streams in, exit edit mode and reset translation
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
      // Switch back to English
      setShowHebrew(false);
      return;
    }

    if (translatedReport) {
      // Already translated, just show it
      setShowHebrew(true);
      return;
    }

    // Translate now
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
        <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
          <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-500">No report generated yet</p>
        <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
          Fill in the form or paste your notes, then click "Analyze" to generate a structured bug report.
        </p>
      </div>
    );
  }

  // Error state
  if (error && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <div className="h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-red-600">Analysis failed</p>
        <p className="text-xs text-gray-500 mt-1">{error}</p>
        <p className="text-xs text-gray-400 mt-2">Check that your API key is set in backend/.env</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Generated Report
          </span>
          {(isLoading || isTranslating) && (
            <span className="inline-flex items-center gap-1 text-xs text-indigo-600">
              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {isTranslating ? 'Translating...' : 'Writing...'}
            </span>
          )}
        </div>

        {report && !isLoading && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
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
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  {showHebrew ? 'English' : 'עברית'}
                </button>
                {onSaveReport && (
                  <button
                    onClick={handleSaveReport}
                    disabled={isSaving || isSaved}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {isSaved ? 'Saved' : isSaving ? 'Saving…' : 'Save'}
                  </button>
                )}
                <CopyButton text={plainTextReport} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5" dir={showHebrew ? 'rtl' : 'ltr'}>
        {isEditing ? (
          <textarea
            value={editedReport}
            onChange={(e) => setEditedReport(e.target.value)}
            className="w-full h-full min-h-[400px] text-sm font-mono border-none outline-none resize-none text-gray-800 leading-relaxed"
            autoFocus
          />
        ) : (
          <>
            <div className="prose prose-sm prose-gray max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside pl-5 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm text-gray-800 leading-relaxed">{children}</li>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = className?.startsWith('language-');
                    return isBlock ? (
                      <code className={`${className ?? ''} block overflow-x-auto`}>{children}</code>
                    ) : (
                      <code className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-800">
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-gray-900 mt-0 mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mt-6 mb-2 border-b border-gray-100 pb-1">
                      {children}
                    </h2>
                  ),
                }}
              >
                {isLoading ? report : activeReport}
              </ReactMarkdown>
              {(isLoading || isTranslating) && (
                <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5" />
              )}
            </div>

            {/* Missing fields notice */}
            {!isLoading && !showHebrew && missingFields && missingFields.length > 0 && (
              <div className="mt-6 border border-amber-200 bg-amber-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-xs font-semibold text-amber-700">Fields not completed</span>
                </div>
                <ul className="space-y-0.5">
                  {missingFields.map((label) => (
                    <li key={label} className="text-xs text-amber-700 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
