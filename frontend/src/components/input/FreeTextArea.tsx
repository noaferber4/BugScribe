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

  const analyzeTitle =
    analyzeBlockedReason === 'files-only'
      ? 'Add a written description before analyzing'
      : analyzeBlockedReason === 'no-changes'
      ? 'No changes detected — update your input first'
      : 'Generate bug report';

  return (
    <div className="space-y-3">
      {/* Section title */}
      <h2 className="text-base font-semibold text-white/85">Describe the bug</h2>

      {/* Prompt-style card container */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-2 transition-colors focus-within:border-white/20">

        {/* Textarea */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your notes, logs, or describe the bug in plain language. The AI will structure it for you..."
          rows={9}
          className="w-full px-2 py-2 text-sm bg-transparent border-0 text-white placeholder:text-white/35 focus:outline-none resize-none leading-relaxed"
        />

        {/* Voice error message */}
        {status === 'error' && errorMessage && (
          <p className="text-xs text-amber-400 px-2 pb-2">{errorMessage}</p>
        )}

        {/* Attached log file badge */}
        {attachedNames.length > 0 && (
          <div className="flex items-center gap-2 mx-1 mb-2 px-2.5 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10">
            <svg className="h-3.5 w-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs text-white/70 flex-1 truncate">{attachedNames.join(', ')}</span>
            <button
              type="button"
              onClick={removeAttachments}
              className="text-white/30 hover:text-red-400 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="flex items-center gap-1.5 px-1 pt-0.5">

          {/* Attach .log file */}
          {attachedNames.length === 0 && (
            <label
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Attach .log file"
            >
              <input
                type="file"
                multiple
                accept=".log"
                className="hidden"
                onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
              />
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </label>
          )}

          <span className="text-xs text-white/20 select-none">.log files only</span>

          {/* Right: mic + analyze */}
          <div className="ml-auto flex items-center gap-1.5">

            {/* Mic button — matches PromptBox position/style */}
            <MicButton
              status={status}
              elapsedSeconds={elapsedSeconds}
              isSupported={isSupported}
              onStart={startRecording}
              onStop={stopRecording}
              onDismiss={dismiss}
              errorMessage={null}
            />

            {/* Analyze (send) button */}
            <button
              onClick={onAnalyze}
              disabled={isLoading || !canAnalyze}
              title={analyzeTitle}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:pointer-events-none bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 text-[#05080f] disabled:text-white/20"
            >
              {isLoading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5" />
                  <path d="M5.25 12L12 5.25L18.75 12" />
                </svg>
              )}
              <span className="sr-only">{isLoading ? 'Analyzing…' : 'Analyze'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Blocked reason hints */}
      {!isLoading && analyzeBlockedReason === 'files-only' && (
        <p className="text-xs text-amber-400">
          Please add a short written description. Log files support the report but can't replace it.
        </p>
      )}
      {!isLoading && analyzeBlockedReason === 'no-changes' && (
        <p className="text-xs text-white/30">
          No changes detected. Update the input to generate a new report.
        </p>
      )}

      {/* Recording status hint */}
      {status === 'recording' && (
        <p className="text-xs text-white/35">Recording… click the stop button when done.</p>
      )}
      {status === 'processing' && (
        <p className="text-xs text-white/35">Processing audio…</p>
      )}
    </div>
  );
}
