import React from 'react';

interface MarkdownRendererProps {
  content?: string;
  onCheckboxChange?: (lineIndex: number, checked: boolean) => void;
  onTaskClick?: (taskId: string) => void;
  onTabClick?: (tabKey: string) => void;
  onProjectClick?: (projectId: string) => void;
  onActionClick?: (actionKey: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content = '',
  onCheckboxChange,
  onTaskClick,
  onTabClick,
  onProjectClick,
  onActionClick,
}) => {
  if (!content) {
    return <span className="text-slate-400 dark:text-slate-500 italic text-sm">Không có mô tả chi tiết cho công việc này.</span>;
  }

  // Parse inline elements (bold, italic, inline code, links)
  const parseInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/^([\s\S]*?)\*\*([\s\S]+?)\*\*([\s\S]*)$/);
      // Italic: *text*
      const italicMatch = remaining.match(/^([\s\S]*?)\*([\s\S]+?)\*([\s\S]*)$/);
      // Inline code: `text`
      const codeMatch = remaining.match(/^([\s\S]*?)`([\s\S]+?)`([\s\S]*)$/);
      // Link: [text](url)
      const linkMatch = remaining.match(/^([\s\S]*?)\[([\s\S]+?)\]\(([\s\S]+?)\)([\s\S]*)$/);

      // Find the first occurring match
      const matches = [
        { type: 'bold', index: boldMatch ? boldMatch[1].length : Infinity, match: boldMatch },
        { type: 'italic', index: italicMatch ? italicMatch[1].length : Infinity, match: italicMatch },
        { type: 'code', index: codeMatch ? codeMatch[1].length : Infinity, match: codeMatch },
        { type: 'link', index: linkMatch ? linkMatch[1].length : Infinity, match: linkMatch },
      ].filter((m) => m.index !== Infinity);

      if (matches.length === 0) {
        parts.push(<span key={keyIndex++}>{remaining}</span>);
        break;
      }

      // Sort matches by index to handle whichever comes first
      matches.sort((a, b) => a.index - b.index);
      const first = matches[0];
      const m = first.match!;

      // Add prefix text
      if (m[1].length > 0) {
        parts.push(<span key={keyIndex++}>{m[1]}</span>);
      }

      // Add matched element
      if (first.type === 'bold') {
        parts.push(<strong key={keyIndex++} className="font-bold text-[var(--text)]">{m[2]}</strong>);
      } else if (first.type === 'italic') {
        parts.push(<em key={keyIndex++} className="italic text-[var(--text-secondary)]">{m[2]}</em>);
      } else if (first.type === 'code') {
        parts.push(
          <code key={keyIndex++} className="bg-[var(--bg)] border border-[var(--border)] text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-xs font-mono">
            {m[2]}
          </code>
        );
      } else if (first.type === 'link') {
        const url = m[3];
        const textLabel = m[2];
        const isTaskLink = url.startsWith('task:');
        const isTabLink = url.startsWith('tab:');

        if (isTaskLink) {
          const taskId = url.substring(5);
          parts.push(
            <a
              key={keyIndex++}
              href={`#task-${taskId}`}
              onClick={(e) => {
                e.preventDefault();
                if (onTaskClick) {
                  onTaskClick(taskId);
                }
              }}
              className="text-[var(--accent)] hover:underline font-bold inline-flex items-center gap-0.5"
            >
              📋 {textLabel}
            </a>
          );
        } else if (isTabLink) {
          const tabKey = url.substring(4);
          parts.push(
            <a
              key={keyIndex++}
              href={`#tab-${tabKey}`}
              onClick={(e) => {
                e.preventDefault();
                if (onTabClick) {
                  onTabClick(tabKey);
                }
              }}
              className="text-sky-600 dark:text-sky-400 hover:underline font-bold inline-flex items-center gap-0.5"
            >
              🔗 {textLabel}
            </a>
          );
        } else if (url.startsWith('project:')) {
          const projectId = url.substring(8);
          parts.push(
            <a
              key={keyIndex++}
              href={`/projects/${projectId === 'list' || projectId === 'all' ? '' : projectId}`}
              onClick={(e) => {
                e.preventDefault();
                if (onProjectClick) {
                  onProjectClick(projectId);
                }
              }}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-0.5"
            >
              📁 {textLabel}
            </a>
          );
        } else if (url.startsWith('action:')) {
          const actionKey = url.substring(7);
          parts.push(
            <a
              key={keyIndex++}
              href={`#action-${actionKey}`}
              onClick={(e) => {
                e.preventDefault();
                if (onActionClick) {
                  onActionClick(actionKey);
                }
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/30 text-[var(--accent)] hover:bg-sky-100 dark:hover:bg-sky-900/40 font-bold border border-sky-200/50 dark:border-sky-800/30 text-xs transition-colors"
            >
              ⚡ {textLabel}
            </a>
          );
        } else {
          parts.push(
            <a
              key={keyIndex++}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 dark:text-sky-400 hover:underline"
            >
              {textLabel}
            </a>
          );
        }
      }

      remaining = m[m.length - 1];
    }

    return parts;
  };

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block check
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        renderedElements.push(
          <pre key={`code-${i}`} className="bg-slate-900 dark:bg-slate-950 text-slate-100 dark:text-slate-200 p-4 rounded-lg border border-[var(--border)] text-xs font-mono overflow-x-auto my-3">
            {codeBlockLang && (
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 select-none border-b border-slate-800 pb-1">{codeBlockLang}</div>
            )}
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = '';
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = line.trim().substring(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Divider
    if (line.trim() === '---' || line.trim() === '***') {
      renderedElements.push(<hr key={`hr-${i}`} className="my-4 border-[var(--border)]" />);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      renderedElements.push(<h1 key={`h1-${i}`} className="text-xl font-bold text-[var(--text-h)] mt-4 mb-2">{parseInline(line.substring(2))}</h1>);
      continue;
    }
    if (line.startsWith('## ')) {
      renderedElements.push(<h2 key={`h2-${i}`} className="text-lg font-bold text-[var(--text-h)] mt-3.5 mb-2">{parseInline(line.substring(3))}</h2>);
      continue;
    }
    if (line.startsWith('### ')) {
      renderedElements.push(<h3 key={`h3-${i}`} className="text-base font-bold text-[var(--text-h)] mt-3 mb-1.5">{parseInline(line.substring(4))}</h3>);
      continue;
    }

    // Checklist checked: - [x] or - [X]
    if (line.trim().startsWith('- [x] ') || line.trim().startsWith('- [X] ')) {
      const restOfLine = line.trim().substring(6);
      const lineIdx = i;
      renderedElements.push(
        <div key={`chk-${i}`} className="flex items-start gap-2.5 my-1 text-[var(--text-tertiary)] line-through">
          <input 
            type="checkbox" 
            checked 
            onChange={(e) => onCheckboxChange && onCheckboxChange(lineIdx, e.target.checked)}
            disabled={!onCheckboxChange}
            className={`mt-1 h-3.5 w-3.5 accent-sky-500 rounded border-slate-300 ${onCheckboxChange ? 'cursor-pointer' : 'pointer-events-none'}`} 
          />
          <span className="text-sm">{parseInline(restOfLine)}</span>
        </div>
      );
      continue;
    }

    // Checklist unchecked: - [ ]
    if (line.trim().startsWith('- [ ] ')) {
      const restOfLine = line.trim().substring(6);
      const lineIdx = i;
      renderedElements.push(
        <div key={`chk-${i}`} className="flex items-start gap-2.5 my-1 text-[var(--text)]">
          <input 
            type="checkbox" 
            checked={false} 
            onChange={(e) => onCheckboxChange && onCheckboxChange(lineIdx, e.target.checked)}
            disabled={!onCheckboxChange}
            className={`mt-1 h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600 ${onCheckboxChange ? 'cursor-pointer' : 'pointer-events-none'}`} 
          />
          <span className="text-sm">{parseInline(restOfLine)}</span>
        </div>
      );
      continue;
    }

    // Bullet List Grouping
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const bulletItems: React.ReactNode[] = [];
      let j = i;
      while (j < lines.length && (lines[j].trim().startsWith('- ') || lines[j].trim().startsWith('* '))) {
        const itemLine = lines[j];
        if (itemLine.trim().startsWith('- [ ] ') || itemLine.trim().startsWith('- [x] ') || itemLine.trim().startsWith('- [X] ')) {
          break;
        }
        const restOfLine = itemLine.trim().substring(2);
        bulletItems.push(
          <li key={`li-${j}`} className="text-sm">
            {parseInline(restOfLine)}
          </li>
        );
        j++;
      }
      if (bulletItems.length > 0) {
        renderedElements.push(
          <ul key={`ul-${i}`} className="list-disc pl-5 my-1 text-[var(--text)] space-y-1">
            {bulletItems}
          </ul>
        );
        i = j - 1;
        continue;
      }
    }

    // Numbered List Grouping
    const numMatch = line.trim().match(/^(\d+)\.\s(.*)$/);
    if (numMatch) {
      const numItems: React.ReactNode[] = [];
      let j = i;
      while (j < lines.length) {
        const itemMatch = lines[j].trim().match(/^(\d+)\.\s(.*)$/);
        if (!itemMatch) break;
        numItems.push(
          <li key={`li-${j}`} className="text-sm">
            {parseInline(itemMatch[2])}
          </li>
        );
        j++;
      }
      renderedElements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 my-1 text-[var(--text)] space-y-1">
          {numItems}
        </ol>
      );
      i = j - 1;
      continue;
    }

    // Paragraph
    if (line.trim().length > 0) {
      renderedElements.push(
        <p key={`p-${i}`} className="text-sm text-[var(--text)] my-1 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    } else {
      renderedElements.push(<div key={`br-${i}`} className="h-2" />);
    }
  }

  return <div className="space-y-0.5">{renderedElements}</div>;
};

export default MarkdownRenderer;
