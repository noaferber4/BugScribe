import { Router, type Request, type Response } from 'express';
import { buildPrompt, type AnalyzeRequest } from '../lib/promptBuilder.js';
import { streamReport } from '../lib/claude.js';

const router = Router();

router.post('/analyze', async (req: Request, res: Response) => {
  const body = req.body as Partial<AnalyzeRequest>;

  // Validate required fields
  if (!body.templateId || !body.templateName || !body.mode) {
    res.status(400).json({ error: 'Missing required fields: templateId, templateName, mode' });
    return;
  }

  const hasStructuredContent =
    body.formValues && Object.values(body.formValues).some((v) => {
      if (typeof v === 'string') return v.trim().length > 0;
      if (Array.isArray(v)) return v.length > 0;
      return false;
    });

  const hasFreeText = body.freeText && body.freeText.trim().length > 0;

  if (!hasStructuredContent && !hasFreeText) {
    res.status(400).json({ error: 'Please provide at least some input before analyzing.' });
    return;
  }

  const request: AnalyzeRequest = {
    templateId: body.templateId,
    templateName: body.templateName,
    fields: body.fields ?? [],
    formValues: body.formValues,
    freeText: body.freeText,
    mode: body.mode,
  };

  try {
    const { user } = buildPrompt(request);
    await streamReport(user, res);
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
