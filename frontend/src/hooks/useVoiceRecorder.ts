import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeAudio } from '../lib/transcribe';

export type RecordingStatus = 'idle' | 'requesting' | 'recording' | 'processing' | 'error';

export interface UseVoiceRecorderReturn {
  status: RecordingStatus;
  elapsedSeconds: number;
  errorMessage: string | null;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  dismiss: () => void;
}

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

function getSupportedMimeType(): string {
  if (typeof window === 'undefined' || !('MediaRecorder' in window)) return '';
  for (const type of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

const SUPPORTED_MIME_TYPE = getSupportedMimeType();

export function useVoiceRecorder(onTranscript: (text: string) => void): UseVoiceRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    'MediaRecorder' in window &&
    !!navigator.mediaDevices?.getUserMedia;

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setError = useCallback((message: string) => {
    clearTimer();
    stopStream();
    setElapsedSeconds(0);
    setErrorMessage(message);
    setStatus('error');
  }, [clearTimer, stopStream]);

  const startRecording = useCallback(async () => {
    if (!isSupported || status !== 'idle') return;
    setStatus('requesting');
    setErrorMessage(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
    } catch (err: unknown) {
      const name = (err as { name?: string }).name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('Microphone access denied. Check browser permissions.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('No microphone found.');
      } else {
        setError('Could not access the microphone.');
      }
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = SUPPORTED_MIME_TYPE;
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onerror = () => {
      setError('Recording failed unexpectedly.');
    };

    recorder.start(250); // collect chunks every 250ms
    setStatus('recording');

    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, [isSupported, status, setError]);

  const stopRecording = useCallback(async () => {
    if (status !== 'recording') return;
    clearTimer();
    setElapsedSeconds(0);
    stopStream();

    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    await new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        setStatus('processing');

        const mimeType = SUPPORTED_MIME_TYPE || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });

        if (blob.size === 0) {
          setError('No audio was captured. Please try again.');
          resolve();
          return;
        }

        const result = await transcribeAudio(blob, mimeType);

        if ('error' in result) {
          setError(result.error);
        } else if (!result.text.trim()) {
          setError('No speech detected. Please try speaking clearly into your microphone.');
        } else {
          onTranscript(result.text.trim());
          setStatus('idle');
        }

        resolve();
      };

      recorder.stop();
    });
  }, [status, clearTimer, stopStream, setError, onTranscript]);

  const dismiss = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
    setElapsedSeconds(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [clearTimer, stopStream]);

  return { status, elapsedSeconds, errorMessage, isSupported, startRecording, stopRecording, dismiss };
}
