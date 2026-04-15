import type { AnalyzeRequest } from './types.js';

export const SYSTEM_PROMPT = `You are BugScribe, a technical writer that converts user-provided bug information into structured bug reports.

Your absolute rule: only write what is explicitly stated or directly and unambiguously implied by the input. Never invent, infer, or assume anything beyond what is given.

Strict constraints:
- Always write the bug report in English, regardless of the language of the input.
- Do NOT infer or speculate about root cause. If the cause is not stated, write "Unknown — requires investigation."
- Do NOT introduce specific field names, parameter names, error codes, or scenarios that are not present in the input.
- Do NOT define expected behavior beyond what the user explicitly described. If not stated, write "Not specified."
- Do NOT add reproduction steps that were not provided or are not strongly and directly implied by the input.
- Do NOT upgrade or downgrade the severity — use the provided value verbatim.
- When information is missing, use: "Not specified", "Unknown", or "Requires investigation." Do not fill in plausible-sounding values.
- For logs or stack traces, reproduce them exactly in fenced code blocks. Do not annotate or interpret them.
- Output ONLY the sections listed in the "Required output format" block of the user message. Do not add any other sections.

Formatting:
- Use Markdown with ## headers and numbered lists for steps.
- Be concise. Do not pad sections with assumptions.`;

export interface PromptParts {
  system: string;
  user: string;
}

export function buildPrompt(req: AnalyzeRequest): PromptParts {
  const lines: string[] = [`Template: **${req.templateName}**`, ''];

  if (req.mode === 'structured') {
    if (req.formValues && Object.keys(req.formValues).length > 0) {
      lines.push('## Structured Input', '');
      for (const field of req.fields) {
        const value = req.formValues[field.id];
        if (!value || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) {
          continue;
        }
        const displayValue = Array.isArray(value) ? value.join(', ') : value;
        lines.push(`### ${field.label}`, displayValue.trim(), '');
      }
    }
  }

  if (req.mode === 'freetext') {
    const fullText = req.freeText?.trim() ?? '';
    const logSplit = fullText.indexOf('[Attached log files:');
    const hasLogs = logSplit !== -1;
    const writtenPart = hasLogs ? fullText.slice(0, logSplit).trim() : fullText;
    const logPart = hasLogs ? fullText.slice(logSplit).trim() : '';

    lines.push(
      '## User Description',
      '',
      'The user has described the following bug. Extract and structure all relevant information. This is the primary input:',
      '',
      writtenPart
    );

    if (hasLogs) {
      lines.push(
        '',
        '## Attached Log Files',
        '',
        'The following log content was attached as supporting context. Use it to supplement and validate the description above, but do not treat it as the primary source. Only extract facts that directly support or clarify what the user described:',
        '',
        logPart
      );
    }
  }

  // Build dynamic output format from template fields
  lines.push('', '---', '', 'Required output format — output ONLY these sections, in this exact order. Do not add any other sections:', '');
  lines.push('# [Bug Title — use the user\'s title verbatim if given, otherwise write a neutral descriptive title]', '');
  for (const field of req.fields) {
    if (field.type === 'file') continue;
    // Skip the title field — it's already the H1 heading above, adding it as a ## section would duplicate it
    if (field.id === 'title') continue;
    lines.push(`## ${field.label}`);
    lines.push('[content based on the input above, or "Not specified" if not provided]', '');
  }

  return {
    system: SYSTEM_PROMPT,
    user: lines.join('\n').trim(),
  };
}

// Re-export the AnalyzeRequest type so routes can import from one place
export type { AnalyzeRequest };
