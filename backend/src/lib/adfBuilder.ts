// Converts a markdown string (as produced by BugScribe) into Atlassian Document Format (ADF).
// Handles: headings (# ##), fenced code blocks, and paragraphs.
// Inline marks handled: **bold**, *italic*, `inline code`.

export interface AdfTextNode {
  type: 'text';
  text: string;
  marks?: { type: 'strong' | 'em' | 'code' }[];
}

type AdfBlockNode =
  | { type: 'heading'; attrs: { level: number }; content: AdfTextNode[] }
  | { type: 'paragraph'; content: AdfTextNode[] }
  | { type: 'codeBlock'; attrs: { language: string }; content: [{ type: 'text'; text: string }] }
  | { type: 'rule' };

export interface AdfDocument {
  version: 1;
  type: 'doc';
  content: AdfBlockNode[];
}

function parseInline(text: string): AdfTextNode[] {
  const nodes: AdfTextNode[] = [];
  // Regex: inline code, bold, italic
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      const plain = text.slice(last, match.index);
      if (plain) nodes.push({ type: 'text', text: plain });
    }

    const raw = match[0];
    if (raw.startsWith('`')) {
      nodes.push({ type: 'text', text: raw.slice(1, -1), marks: [{ type: 'code' }] });
    } else if (raw.startsWith('**')) {
      nodes.push({ type: 'text', text: raw.slice(2, -2), marks: [{ type: 'strong' }] });
    } else {
      nodes.push({ type: 'text', text: raw.slice(1, -1), marks: [{ type: 'em' }] });
    }

    last = match.index + raw.length;
  }

  if (last < text.length) {
    const remaining = text.slice(last);
    if (remaining) nodes.push({ type: 'text', text: remaining });
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text }];
}

export function markdownToAdf(markdown: string): AdfDocument {
  const lines = markdown.split('\n');
  const content: AdfBlockNode[] = [];

  let i = 0;
  let pendingParagraphLines: string[] = [];

  function flushParagraph() {
    if (pendingParagraphLines.length === 0) return;
    const text = pendingParagraphLines.join('\n').trim();
    pendingParagraphLines = [];
    if (!text) return;
    content.push({ type: 'paragraph', content: parseInline(text) });
  }

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      flushParagraph();
      const lang = line.slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      content.push({
        type: 'codeBlock',
        attrs: { language: lang },
        content: [{ type: 'text', text: codeLines.join('\n') }],
      });
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushParagraph();
      content.push({ type: 'rule' });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      content.push({
        type: 'heading',
        attrs: { level },
        content: [{ type: 'text', text }],
      });
      i++;
      continue;
    }

    // Blank line: flush pending paragraph
    if (line.trim() === '') {
      flushParagraph();
      i++;
      continue;
    }

    // Regular text: accumulate into paragraph
    pendingParagraphLines.push(line);
    i++;
  }

  flushParagraph();

  // Ensure the document is never empty
  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [{ type: 'text', text: ' ' }] });
  }

  return { version: 1, type: 'doc', content };
}
