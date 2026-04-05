import Anthropic from '@anthropic-ai/sdk';
import type { Response } from 'express';
import { SYSTEM_PROMPT } from './promptBuilder.js';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function streamTranslation(report: string, targetLanguage: string, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Translate the following bug report into ${targetLanguage}. Preserve the exact Markdown structure, all section headers, numbering, and formatting. Only translate the text content — do not add, remove, or reorder any sections. Do not add explanations or commentary.\n\n${report}`,
      },
    ],
  });

  stream.on('text', (delta: string) => {
    res.write(`data: ${JSON.stringify({ delta })}\n\n`);
  });

  await stream.finalMessage();
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
}

export async function streamReport(userPrompt: string, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        // @ts-ignore — cache_control is valid on the API but may not be typed yet
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });

  stream.on('text', (delta: string) => {
    res.write(`data: ${JSON.stringify({ delta })}\n\n`);
  });

  await stream.finalMessage();
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
}
