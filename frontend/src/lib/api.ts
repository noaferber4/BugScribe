import type { AnalyzeRequest } from '../types';

export async function translateReport(
  report: string,
  targetLanguage: string,
  onChunk: (delta: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
): Promise<void> {
  let response: Response;

  try {
    response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report, targetLanguage }),
    });
  } catch {
    onError('Network error. Make sure the backend is running.');
    return;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }));
    onError(data.error ?? 'Request failed');
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError('Streaming not supported by this browser.');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const dataLine = line.trim();
      if (!dataLine.startsWith('data:')) continue;

      try {
        const parsed = JSON.parse(dataLine.slice(5).trim());
        if (parsed.error) { onError(parsed.error); return; }
        if (parsed.done) { onDone(); return; }
        if (typeof parsed.delta === 'string') onChunk(parsed.delta);
      } catch {
        // Ignore malformed SSE lines
      }
    }
  }

  onDone();
}

export async function analyzeReport(
  request: AnalyzeRequest,
  onChunk: (delta: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
): Promise<void> {
  let response: Response;

  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    onError('Network error. Make sure the backend is running.');
    return;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }));
    onError(data.error ?? 'Request failed');
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError('Streaming not supported by this browser.');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const dataLine = line.trim();
      if (!dataLine.startsWith('data:')) continue;

      try {
        const parsed = JSON.parse(dataLine.slice(5).trim());
        if (parsed.error) {
          onError(parsed.error);
          return;
        }
        if (parsed.done) {
          onDone();
          return;
        }
        if (typeof parsed.delta === 'string') {
          onChunk(parsed.delta);
        }
      } catch {
        // Ignore malformed SSE lines
      }
    }
  }

  onDone();
}
