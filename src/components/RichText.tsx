// Markdown mínimo y seguro para las respuestas: párrafos, listas, negritas y
// enlaces. React escapa todo el texto, así que no se puede inyectar HTML.

import { Fragment } from 'react';

const INLINE_RE = /(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s)<>]+)/g;

function Inline({ text }: { text: string }) {
  const parts = text.split(INLINE_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        const md = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
        const href = md ? md[2] : /^https?:\/\//.test(part) ? part.replace(/[.,;:]+$/, '') : null;
        if (href) {
          const label = md ? md[1] : href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
          const trailing = md ? '' : part.slice(href.length);
          return (
            <Fragment key={i}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 [overflow-wrap:anywhere]"
              >
                {label}
              </a>
              {trailing}
            </Fragment>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

type Block = { type: 'p'; lines: string[] } | { type: 'ul' | 'ol'; items: string[] };

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const last = blocks[blocks.length - 1];
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (!line) {
      blocks.push({ type: 'p', lines: [] });
    } else if (bullet) {
      if (last?.type === 'ul') last.items.push(bullet[1]);
      else blocks.push({ type: 'ul', items: [bullet[1]] });
    } else if (numbered) {
      if (last?.type === 'ol') last.items.push(numbered[1]);
      else blocks.push({ type: 'ol', items: [numbered[1]] });
    } else {
      // Los títulos markdown se muestran como texto en negrita.
      const heading = line.match(/^#{1,6}\s+(.*)$/);
      const content = heading ? `**${heading[1].replace(/\*\*/g, '')}**` : line;
      if (last?.type === 'p') last.lines.push(content);
      else blocks.push({ type: 'p', lines: [content] });
    }
  }
  return blocks.filter((b) => (b.type === 'p' ? b.lines.length > 0 : b.items.length > 0));
}

export function RichText({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-2 break-words">
      {blocks.map((block, i) => {
        if (block.type === 'p') {
          return (
            <p key={i}>
              {block.lines.map((line, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  <Inline text={line} />
                </Fragment>
              ))}
            </p>
          );
        }
        const List = block.type === 'ul' ? 'ul' : 'ol';
        return (
          <List
            key={i}
            className={`space-y-1 pl-5 ${block.type === 'ul' ? 'list-disc' : 'list-decimal'}`}
          >
            {block.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} />
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
