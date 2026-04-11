import type { RecordingStatus } from '../../hooks/useVoiceRecorder';

interface MicButtonProps {
  status: RecordingStatus;
  elapsedSeconds: number;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  onDismiss: () => void;
  /** Pass null to suppress inline error (show it outside this component instead) */
  errorMessage: string | null;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}

export function MicButton({
  status,
  elapsedSeconds,
  isSupported,
  onStart,
  onStop,
  onDismiss,
  errorMessage,
}: MicButtonProps) {
  if (status === 'recording') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-red-400/80 tabular-nums">{formatTime(elapsedSeconds)}</span>
        <button
          type="button"
          onClick={onStop}
          title="Stop recording"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <StopIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <button
        type="button"
        disabled
        title="Processing audio…"
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 cursor-not-allowed"
      >
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </button>
    );
  }

  if (status === 'requesting') {
    return (
      <button
        type="button"
        disabled
        title="Requesting microphone access…"
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 cursor-not-allowed animate-pulse"
      >
        <MicIcon className="h-5 w-5" />
      </button>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1">
        {errorMessage && (
          <span className="text-xs text-amber-400">{errorMessage}</span>
        )}
        {errorMessage && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex h-5 w-5 items-center justify-center rounded text-white/30 hover:text-white/60 transition-colors"
            title="Dismiss"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {/* Mic button returns to idle look so user can retry */}
        <button
          type="button"
          onClick={onStart}
          title="Try again"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <MicIcon className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // idle
  return (
    <button
      type="button"
      onClick={isSupported ? onStart : undefined}
      disabled={!isSupported}
      title={isSupported ? 'Record voice description' : 'Voice recording is not supported in this browser'}
      className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-white/60 disabled:hover:bg-transparent transition-colors"
    >
      <MicIcon className="h-5 w-5" />
    </button>
  );
}
