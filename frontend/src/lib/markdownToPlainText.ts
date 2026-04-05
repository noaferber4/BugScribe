/**
 * Converts markdown to clean plain text suitable for pasting into Jira, Monday, etc.
 * - Headings become uppercase labels followed by a colon
 * - Bold/italic markers are stripped
 * - List bullets are converted to •
 * - Horizontal rules are removed
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .split('\n')
    .map((line) => {
      // H1 → plain title
      if (/^# (.+)/.test(line)) return line.replace(/^# /, '');
      // H2 → SECTION LABEL:
      if (/^## (.+)/.test(line)) return line.replace(/^## /, '').toUpperCase() + ':';
      // H3 → Section label:
      if (/^### (.+)/.test(line)) return line.replace(/^### /, '') + ':';
      // Horizontal rule
      if (/^---+$/.test(line.trim())) return '';
      // Unordered list bullets
      line = line.replace(/^(\s*)[-*] /, '$1• ');
      // Bold + italic combined ***text***
      line = line.replace(/\*{3}(.+?)\*{3}/g, '$1');
      // Bold **text**
      line = line.replace(/\*{2}(.+?)\*{2}/g, '$1');
      // Italic *text*
      line = line.replace(/\*(.+?)\*/g, '$1');
      // Inline code `text`
      line = line.replace(/`(.+?)`/g, '$1');
      return line;
    })
    .join('\n')
    // Collapse 3+ consecutive blank lines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
