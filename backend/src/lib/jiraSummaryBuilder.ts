import type { TemplateField, FormValues } from './types.js';

// Derives a Jira issue summary from template fields + form values.
// Priority: field labeled title/summary/name → fallback composite from first 3 filled fields.
export function buildJiraSummary(fields: TemplateField[], formValues: FormValues): string {
  // 1. Look for a field whose label is "title", "summary", or "name" (case-insensitive)
  const titleField = fields.find((f) =>
    f.type !== 'file' && /^(title|summary|name)$/i.test(f.label.trim())
  );

  if (titleField) {
    const val = formValues[titleField.id];
    const text = Array.isArray(val) ? val.join(', ') : (val ?? '');
    if (text.trim()) return truncate(text.trim(), 255);
  }

  // 2. Fallback: compose from the first 3 non-empty, non-file fields
  const parts: string[] = [];
  for (const field of fields) {
    if (field.type === 'file') continue;
    const val = formValues[field.id];
    const text = Array.isArray(val) ? val.join(', ') : (val ?? '');
    if (text.trim()) {
      parts.push(`${field.label}: ${text.trim()}`);
      if (parts.length >= 3) break;
    }
  }

  if (parts.length > 0) return truncate(parts.join(' — '), 255);

  // 3. Last resort (freetext mode — no formValues available)
  return 'Bug report';
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1).trimEnd() + '…';
}
