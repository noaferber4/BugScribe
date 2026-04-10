import { useState } from 'react';
import type { AnalyzeBlockedReason } from '../../App';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { MicButton } from './MicButton';

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

  const { status, elapsedSeconds, errorMessage, isSupported, startRecording, stopRecording, dismiss } =
    useVoiceRecorder((transcript) => {
      const current = value.trim();
      onChange(current ? `${current}\n\n${transcript}` : transcript);
    });

  function handleFiles(files: File[]) {
    const logs = files.filter((f) => /\.log$/i.test(f.name));
    if (logs.length === 0) return;
    const names = logs.map((f) => f.name);
    setAttachedNames(names);

    const readers = logs.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsText(file);
        })
    );
    Promise.all(readers).then((contents) => {
      const sections = contents.map((content, i) =>
        `--- Log File: ${names[i]} ---\n${content.slice(0, 4000)}`
      );
      onAttachmentsChange(`[Attached log files: ${names.join(', ')}]\n\n${sections.join('\n\n')}`);
    });
  }

  function removeAttachments() {
    setAttachedNames([]);
    onAttachmentsChange('');
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-white/70">Describe the Bug</label>
          <MicButton
            status={status}
            elapsedSeconds={elapsedSeconds}
            isSupported={isSupported}
            onStart={startRecording}
            onStop={stopRecording}
            onDismiss={dismiss}
            errorMessage={errorMessage}
          />
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your notes, logs, or describe the bug in plain language. The AI will structure it for you..."
          rows={10}
          className="w-full px-3 py-2 text-sm bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 rounded-lg focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/15 transition-colors resize-none"
        />
      </div>

      {/* File attachment */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5">
          Log Files <span className="text-white/25 font-normal">(optional — used to support analysis)</span>
        </label>
        {attachedNames.length > 0 ? (
          <div className="flex items-center gap-3 px-3 py-2.5 border border-cyan-500/20 bg-cyan-500/10 rounded-lg">
            <svg className="h-4 w-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs text-white/70 flex-1 truncate">{attachedNames.join(', ')}</span>
            <button
              type="button"
              onClick={removeAttachments}
              className="text-white/30 hover:text-red-400 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 px-3 py-2.5 border border-dashed border-white/10 rounded-lg cursor-pointer hover:border-cyan-500/30 hover:bg-white/[0.03] transition-colors">
            <input
              type="file"
              multiple
              accept=".log"
              className="hidden"
              onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
            />
            <svg className="h-4 w-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs text-white/40">Attach .log files to support the report</span>
          </label>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={onAnalyze}
          disabled={isLoading || !canAnalyze}
          className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/30 disabled:cursor-not-allowed text-[#05080f] disabled:text-[#05080f]/50 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
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
          <p className="text-xs text-amber-400 text-center">
            Please add a short written description before generating the report. Files can support the bug report, but cannot replace written input.
          </p>
        )}
        {!isLoading && analyzeBlockedReason === 'no-changes' && (
          <p className="text-xs text-white/30 text-center">
            No changes detected. Update the input to generate a new report.
          </p>
        )}
      </div>
    </div>
  );
}
