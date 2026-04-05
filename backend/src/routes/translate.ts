import { Router, type Request, type Response } from 'express';
import { streamTranslation } from '../lib/claude.js';

const router = Router();

router.post('/translate', async (req: Request, res: Response) => {
  const { report, targetLanguage } = req.body as { report?: string; targetLanguage?: string };

  if (!report || typeof report !== 'string' || !report.trim()) {
    res.status(400).json({ error: 'Missing report content.' });
    return;
  }

  const lang = targetLanguage ?? 'Hebrew';

  try {
    await streamTranslation(report, lang, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  }
});

export default router;
