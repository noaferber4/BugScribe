export async function transcribeAudio(
  audioBlob: Blob,
  mimeType: string,
): Promise<{ text: string } | { error: string }> {
  try {
    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append('audio', audioBlob, `recording.${ext}`);
    formData.append('mimeType', mimeType);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type — browser sets it with the correct multipart boundary
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: (data as { error?: string }).error ?? 'Transcription failed. Please try again.' };
    }

    return { text: (data as { text: string }).text };
  } catch {
    return { error: 'Network error. Make sure the backend is running.' };
  }
}
