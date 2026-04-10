import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import OpenAI from 'openai';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // Whisper's 25MB limit
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function mimeToExtension(mime: string): string {
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4')) return 'mp4';
  return 'webm'; // default covers audio/webm and audio/webm;codecs=opus
}

router.post('/transcribe', upload.single('audio'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file received.' });
    return;
  }

  const mimeType: string = (req.body.mimeType as string) ?? 'audio/webm';
  const ext = mimeToExtension(mimeType);
  const file = new File([req.file.buffer], `recording.${ext}`, { type: mimeType });

  try {
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      response_format: 'text',
    });

    // Whisper with response_format:'text' returns a plain string
    const text = typeof transcription === 'string' ? transcription : '';
    res.json({ text });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 400) {
      // Whisper returns 400 when no speech is detected — treat as empty transcription
      res.json({ text: '' });
      return;
    }
    if (status === 413) {
      res.status(400).json({ error: 'Recording too large. Please record a shorter clip.' });
      return;
    }
    res.status(500).json({ error: 'Transcription failed. Please try again.' });
  }
});

export default router;
