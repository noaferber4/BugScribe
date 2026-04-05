import { useState } from 'react';
import type { AnalyzeBlockedReason } from '../../App';

export function FreeTextArea({
  value,
  onChange,
  onAttachmentsChange,
  onAnalyze,
  isLoading,
  canAnalyze,
  analyzeBlockedReason,
}: {
  value: string;
  onChange: (v: string) => void;
  onAttachmentsChange: (extra: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  canAnalyze: boolean;
  analyzeBlockedReason: AnalyzeBlockedReason;
}) {
  const [attachedNames, setAttachedNames] = useState<string[]>([]);

  function handleFiles(files: File[]) {
    if (files.length === 0) return;
    const names = files.map((f) => f.name);
    setAttachedNames(names);

    // For text-based files, read content; for others, just record names
    const textFile = files.find((f) => /\.(log|txt|json|xml|csv)$/i.test(f.name));
    if (textFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const extra = `[Attached files: ${names.join(', ')}]\n\n${content.slice(0, 4000)}`;
        onAttachmentsChange(extra);
      };
      reader.readAsText(textFile);
    } else {
      onAttachmentsChange(`[Attached files: ${names.join(', ')}]`);
    }
  }

  function removeAttachments() {
    setAttachedNames([]);
    onAttachmentsChange('');
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Describe the Bug
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your notes, logs, or describe the bug in plain language. The AI will structure it for you..."
          rows={10}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors resize-none"
        />
      </div>

      {/* File attachment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Attachments <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        {attachedNames.length > 0 ? (
          <div className="flex items-center gap-3 px-3 py-2.5 border border-indigo-200 bg-indigo-50 rounded-lg">
            <svg className="h-4 w-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs text-gray-700 flex-1 truncate">{attachedNames.join(', ')}</span>
            <button
              type="button"
              onClick={removeAttachments}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 px-3 py-2.5 border border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*,video/*,.log,.txt,.json,.xml,.csv,.pdf"
              className="hidden"
              onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
            />
            <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs text-gray-500">Attach images, videos, logs, or text files</span>
          </label>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={onAnalyze}
          disabled={isLoading || !canAnalyze}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Analyze
            </>
          )}
        </button>
        {!isLoading && analyzeBlockedReason === 'files-only' && (
          <p className="text-xs text-amber-600 text-center">
            Please add a short written description before generating the report. Files can support the bug report, but cannot replace written input.
          </p>
        )}
        {!isLoading && analyzeBlockedReason === 'no-changes' && (
          <p className="text-xs text-gray-400 text-center">
            No changes detected. Update the input to generate a new report.
          </p>
        )}
      </div>
    </div>
  );
}
