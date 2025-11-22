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

  // 2. Enhanced Parsing for Main Content
  const renderRichText = (text: string) => {
    if (!text) return null;
    
    // Split by code blocks first
    const parts = text.split(/(```[\w-]*\n[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      // Code Block
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const language = lines[0].replace('```', '').trim();
        const code = lines.slice(1, part.endsWith('```') ? -1 : undefined).join('\n');
        return <CodeBlock key={index} language={language} code={code} />;
      }
      
      // Process other markdown elements line by line
      const lines = part.split('\n');
      return (
        <div key={index} className="text-gray-800 dark:text-gray-100 leading-7 space-y-1">
            {lines.map((line, lineIdx) => {
                if (!line.trim()) return <div key={lineIdx} className="h-2"></div>; // Spacing

                // Headers (### Title)
                if (line.startsWith('### ')) {
                    return <h3 key={lineIdx} className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white tracking-tight">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('## ')) {
                    return <h2 key={lineIdx} className="text-xl font-bold mt-6 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 text-gray-900 dark:text-white tracking-tight">{line.replace('## ', '')}</h2>;
                }

                // Blockquotes (> Text)
                if (line.startsWith('> ')) {
                    return (
                        <div key={lineIdx} className="flex gap-3 pl-4 border-l-4 border-blue-300 dark:border-blue-600/50 italic text-gray-600 dark:text-gray-400 my-2 py-1 bg-gray-50 dark:bg-gray-900/30 rounded-r">
                            <div>{parseInlineStyles(line.replace('> ', ''))}</div>
                        </div>
                    );
                }

                // Lists (- Item or * Item)
                if (line.trim().match(/^[-*]\s/)) {
                     return (
                        <div key={lineIdx} className="flex gap-2 ml-2 items-start">
                            <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 flex-shrink-0"></div>
                            <div className="flex-1">{parseInlineStyles(line.replace(/^[-*]\s/, ''))}</div>
                        </div>
                     );
                }

                // Numbered Lists (1. Item)
                const numMatch = line.match(/^(\d+)\.\s/);
                if (numMatch) {
                    return (
                        <div key={lineIdx} className="flex gap-2 ml-2 items-start">
                            <span className="font-mono text-gray-500 font-bold min-w-[1.5rem] text-right">{numMatch[1]}.</span>
                            <div className="flex-1">{parseInlineStyles(line.replace(/^(\d+)\.\s/, ''))}</div>
                        </div>
                    );
                }

                // Regular Paragraph
                return <p key={lineIdx}>{parseInlineStyles(line)}</p>;
            })}
        </div>
      );
    });
  };

  // Helper for inline styles (**bold**, `code`, [link](url), *italic*)
  const parseInlineStyles = (text: string) => {
    // 1. Split by Inline Code (High priority, preserves content)
    const codeParts = text.split(/(`[^`]+`)/g);
    
    return codeParts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400 break-all">{part.slice(1, -1)}</code>;
        }

        // 2. Split by Links
        const linkParts = part.split(/(\[[^\]]+\]\([^)]+\))/g);
        return linkParts.map((subPart, j) => {
            const linkMatch = subPart.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                return (
                    <a 
                        key={`${i}-${j}`} 
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

            // 3. Split by Bold
            const boldParts = subPart.split(/(\*\*.*?\*\*)/g);
            return boldParts.map((bPart, k) => {
                if (bPart.startsWith('**') && bPart.endsWith('**')) {
                    return <strong key={`${i}-${j}-${k}`} className="font-bold text-gray-900 dark:text-white">{bPart.slice(2, -2)}</strong>;
                }

                // 4. Split by Italic
                // Simple regex for *text* or _text_
                const italicParts = bPart.split(/(\*[^*]+\*)/g);
                return italicParts.map((iPart, l) => {
                    if (iPart.startsWith('*') && iPart.endsWith('*')) {
                         return <em key={`${i}-${j}-${k}-${l}`} className="italic text-gray-800 dark:text-gray-200">{iPart.slice(1, -1)}</em>;
                    }
                    return iPart;
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