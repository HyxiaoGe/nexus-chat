import React, { useState, useEffect } from 'react';
import { Terminal, Check, Copy, ChevronDown, ChevronRight, BrainCircuit, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CodeBlockProps {
  language: string;
  code: string;
}

// Enhanced CodeBlock Component
const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-[#0d1117] group">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-2">
            <div className="flex gap-1.5 mr-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 group-hover:bg-red-500 transition-colors"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 group-hover:bg-yellow-500 transition-colors"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80 group-hover:bg-green-500 transition-colors"></div>
            </div>
            <Terminal size={13} className="text-gray-500 dark:text-gray-400 ml-1" />
            <span className="text-xs font-bold font-mono text-gray-600 dark:text-gray-300 uppercase">{language || t('common.text')}</span>
        </div>
        <button 
          onClick={handleCopy} 
          className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-gray-300 dark:bg-gray-700/50 px-2 py-1 rounded hover:bg-gray-300/80 dark:hover:bg-gray-700"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? t('common.copied') : t('common.copy')}
        </button>
      </div>
      <div className="relative bg-[#1e1e1e] p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <pre className="text-sm font-mono text-gray-100 leading-relaxed tab-4">
            <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

interface SmartContentRendererProps {
    content: string;
    isStreaming?: boolean;
}

// Component to render content with enhanced markdown-like parsing
export const SmartContentRenderer: React.FC<SmartContentRendererProps> = ({ content, isStreaming }) => {
  const { t } = useTranslation();
  
  // 1. Extract Thinking Process (<think>...</think>)
  // CRITICAL FIX: Merge fragmentation like </think><think> that occurs during streaming
  const cleanedContent = content.replace(/<\/think>\s*<think>/g, '');
  
  const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/i;
  const match = cleanedContent.match(thinkRegex);
  
  let thinkingContent = '';
  let mainContent = cleanedContent;
  
  // Check if we are currently receiving thinking tokens
  // Logic: Streaming is active AND we have a start tag but NO end tag in the simplified content
  const isThinkingActive = !!(isStreaming && match && !cleanedContent.includes('</think>'));

  if (match) {
    thinkingContent = match[1].trim();
    mainContent = cleanedContent.replace(match[0], '').trim();
  }

  // Initialize state:
  // If actively streaming, default to OPEN.
  // If loading from history (isStreaming is false), default to CLOSED to save space.
  const [isThinkingOpen, setIsThinkingOpen] = useState(!!isThinkingActive);

  // Auto-expand thinking if it becomes active during streaming
  useEffect(() => {
      if (isThinkingActive && !isThinkingOpen) {
          setIsThinkingOpen(true);
      }
  }, [isThinkingActive]);

  // Auto-collapse thinking when streaming completes
  useEffect(() => {
      if (!isStreaming && thinkingContent && isThinkingOpen) {
          // Delay collapse slightly so user can see it's complete
          const timer = setTimeout(() => {
              setIsThinkingOpen(false);
          }, 1500);
          return () => clearTimeout(timer);
      }
  }, [isStreaming, thinkingContent, isThinkingOpen]);

  // Helper to detect and render tables
  const isTableRow = (line: string) => {
    return line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|');
  };

  const parseTable = (lines: string[], startIdx: number) => {
    const tableLines: string[] = [];
    let idx = startIdx;

    while (idx < lines.length && isTableRow(lines[idx])) {
      tableLines.push(lines[idx]);
      idx++;
    }

    if (tableLines.length < 2) return { consumed: 0, element: null };

    // Parse header
    const headerCells = tableLines[0].split('|').map(c => c.trim()).filter(c => c);

    // Skip separator row (index 1)

    // Parse body rows
    const bodyRows = tableLines.slice(2).map(row =>
      row.split('|').map(c => c.trim()).filter(c => c)
    );

    const table = (
      <div className="my-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              {headerCells.map((cell, i) => (
                <th key={i} className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold">
                  {parseInlineStyles(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                    {parseInlineStyles(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    return { consumed: tableLines.length, element: table };
  };

  // 2. Enhanced Parsing for Main Content
  const renderRichText = (text: string) => {
    if (!text) return null;

    // Split by code blocks and math blocks first
    const parts = text.split(/(```[\w-]*\n[\s\S]*?```|\$\$[\s\S]*?\$\$)/g);

    return parts.map((part, index) => {
      // Code Block
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const language = lines[0].replace('```', '').trim();
        const code = lines.slice(1, part.endsWith('```') ? -1 : undefined).join('\n');
        return <CodeBlock key={index} language={language} code={code} />;
      }

      // Block Math ($$...$$)
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const mathContent = part.slice(2, -2).trim();
        return (
          <div key={index} className="my-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg overflow-x-auto">
            <div className="text-center font-serif italic text-blue-900 dark:text-blue-200">
              {mathContent}
            </div>
          </div>
        );
      }

      // Process other markdown elements line by line
      const lines = part.split('\n');
      const elements: React.ReactNode[] = [];
      let lineIdx = 0;

      while (lineIdx < lines.length) {
        const line = lines[lineIdx];

        if (!line.trim()) {
          elements.push(<div key={`space-${lineIdx}`} className="h-2"></div>);
          lineIdx++;
          continue;
        }

        // Check for tables
        if (isTableRow(line)) {
          const { consumed, element } = parseTable(lines, lineIdx);
          if (element) {
            elements.push(<div key={`table-${lineIdx}`}>{element}</div>);
            lineIdx += consumed;
            continue;
          }
        }

        // Headers (### Title)
        if (line.startsWith('### ')) {
          elements.push(<h3 key={lineIdx} className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white tracking-tight">{parseInlineStyles(line.replace('### ', ''))}</h3>);
          lineIdx++;
          continue;
        }
        if (line.startsWith('## ')) {
          elements.push(<h2 key={lineIdx} className="text-xl font-bold mt-6 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 text-gray-900 dark:text-white tracking-tight">{parseInlineStyles(line.replace('## ', ''))}</h2>);
          lineIdx++;
          continue;
        }

        // Blockquotes (> Text)
        if (line.startsWith('> ')) {
          elements.push(
            <div key={lineIdx} className="flex gap-3 pl-4 border-l-4 border-blue-300 dark:border-blue-600/50 italic text-gray-600 dark:text-gray-400 my-2 py-1 bg-gray-50 dark:bg-gray-900/30 rounded-r">
              <div>{parseInlineStyles(line.replace('> ', ''))}</div>
            </div>
          );
          lineIdx++;
          continue;
        }

        // Task Lists (- [ ] or - [x])
        const taskMatch = line.trim().match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (taskMatch) {
          const isChecked = taskMatch[1].toLowerCase() === 'x';
          const taskText = taskMatch[2];
          elements.push(
            <div key={lineIdx} className="flex gap-2 ml-2 items-start">
              <input
                type="checkbox"
                checked={isChecked}
                disabled
                className="mt-2 w-4 h-4 rounded border-gray-300 dark:border-gray-600"
              />
              <div className={`flex-1 ${isChecked ? 'line-through text-gray-500 dark:text-gray-600' : ''}`}>
                {parseInlineStyles(taskText)}
              </div>
            </div>
          );
          lineIdx++;
          continue;
        }

        // Regular Lists (- Item or * Item)
        if (line.trim().match(/^[-*]\s/)) {
          elements.push(
            <div key={lineIdx} className="flex gap-2 ml-2 items-start">
              <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 flex-shrink-0"></div>
              <div className="flex-1">{parseInlineStyles(line.replace(/^[-*]\s/, ''))}</div>
            </div>
          );
          lineIdx++;
          continue;
        }

        // Numbered Lists (1. Item)
        const numMatch = line.match(/^(\d+)\.\s/);
        if (numMatch) {
          elements.push(
            <div key={lineIdx} className="flex gap-2 ml-2 items-start">
              <span className="font-mono text-gray-500 font-bold min-w-[1.5rem] text-right">{numMatch[1]}.</span>
              <div className="flex-1">{parseInlineStyles(line.replace(/^(\d+)\.\s/, ''))}</div>
            </div>
          );
          lineIdx++;
          continue;
        }

        // Regular Paragraph
        elements.push(<p key={lineIdx}>{parseInlineStyles(line)}</p>);
        lineIdx++;
      }

      return (
        <div key={index} className="text-gray-800 dark:text-gray-100 leading-7 space-y-1">
          {elements}
        </div>
      );
    });
  };

  // Helper for inline styles (**bold**, `code`, [link](url), *italic*, $math$)
  const parseInlineStyles = (text: string) => {
    // 1. Split by Inline Math ($ ... $)
    const mathParts = text.split(/(\$[^$]+\$)/g);

    return mathParts.map((mathPart, i) => {
        if (mathPart.startsWith('$') && mathPart.endsWith('$') && mathPart.length > 2) {
            const mathContent = mathPart.slice(1, -1);
            return (
              <span key={i} className="inline-block bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded text-sm font-serif italic text-blue-800 dark:text-blue-300 mx-1">
                {mathContent}
              </span>
            );
        }

        // 2. Split by Inline Code (High priority, preserves content)
        const codeParts = mathPart.split(/(`[^`]+`)/g);

        return codeParts.map((codePart, j) => {
            if (codePart.startsWith('`') && codePart.endsWith('`')) {
                return <code key={`${i}-${j}`} className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400 break-all">{codePart.slice(1, -1)}</code>;
            }

            // 3. Split by Links
            const linkParts = codePart.split(/(\[[^\]]+\]\([^)]+\))/g);
            return linkParts.map((subPart, k) => {
                const linkMatch = subPart.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                if (linkMatch) {
                    return (
                        <a
                            key={`${i}-${j}-${k}`}
                            href={linkMatch[2]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                        >
                            {linkMatch[1]}
                            <ExternalLink size={10} className="opacity-70" />
                        </a>
                    );
                }

                // 4. Split by Bold
                const boldParts = subPart.split(/(\*\*.*?\*\*)/g);
                return boldParts.map((bPart, l) => {
                    if (bPart.startsWith('**') && bPart.endsWith('**')) {
                        return <strong key={`${i}-${j}-${k}-${l}`} className="font-bold text-gray-900 dark:text-white">{bPart.slice(2, -2)}</strong>;
                    }

                    // 5. Split by Italic
                    const italicParts = bPart.split(/(\*[^*]+\*)/g);
                    return italicParts.map((iPart, m) => {
                        if (iPart.startsWith('*') && iPart.endsWith('*')) {
                             return <em key={`${i}-${j}-${k}-${l}-${m}`} className="italic text-gray-800 dark:text-gray-200">{iPart.slice(1, -1)}</em>;
                        }
                        return iPart;
                    });
                });
            });
        });
    });
  };

  return (
    <div className="space-y-4">
      {/* Thinking Process Accordion */}
      {thinkingContent && (
        <div className={`
            rounded-xl border overflow-hidden my-3 transition-all duration-500
            ${isThinkingActive 
                ? 'border-purple-400/50 dark:border-purple-500/50 bg-purple-50/50 dark:bg-purple-900/10 shadow-[0_0_15px_-3px_rgba(168,85,247,0.15)]' 
                : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30'}
        `}>
          <button 
            onClick={() => setIsThinkingOpen(!isThinkingOpen)}
            className={`
                w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-xs font-medium select-none border-b 
                ${isThinkingActive 
                    ? 'bg-purple-100/30 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/30' 
                    : 'bg-gray-100/30 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'}
            `}
          >
            <div className={`p-1 rounded-md ${isThinkingActive ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                 <BrainCircuit size={14} className={isThinkingActive ? "animate-pulse" : ""} />
            </div>
            
            <div className="flex-1 flex items-center gap-2">
                <span className={`uppercase tracking-wider text-[10px] font-bold ${isThinkingActive ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isThinkingActive ? t('app.thinking') : t('app.chainOfThought')}
                </span>
                {isThinkingActive && (
                    <span className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce delay-0"></span>
                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce delay-150"></span>
                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce delay-300"></span>
                    </span>
                )}
            </div>

            {isThinkingOpen ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
          </button>
          
          {isThinkingOpen && (
            <div className="p-4 text-xs leading-relaxed text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap animate-in slide-in-from-top-2 duration-200 max-h-[500px] overflow-y-auto custom-scrollbar bg-white/50 dark:bg-black/20">
              {thinkingContent}
              {isThinkingActive && <span className="animate-pulse ml-0.5 inline-block w-1.5 h-3 bg-purple-400 align-middle"></span>}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="min-w-0 markdown-body">
        {renderRichText(mainContent)}
      </div>
    </div>
  );
};