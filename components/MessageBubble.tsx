
import React from 'react';
import { Message, AgentConfig } from '../types';
import { Bot, User, Copy, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MessageBubbleProps {
  message: Message;
  config?: AgentConfig; // Changed type
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, config }) => {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] lg:max-w-[65%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg ${isUser ? 'bg-indigo-600' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'}`}>
          {isUser ? (
            <User size={18} className="text-white" />
          ) : (
            <span className="text-lg select-none flex items-center justify-center">{config?.avatar || <Bot size={18} className="text-gray-600 dark:text-gray-300"/>}</span>
          )}
        </div>

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
          
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className={`text-xs font-bold ${isUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {isUser ? t('common.you') : config?.name || t('app.configError')}
            </span>
            {!isUser && (
                <span className="text-[10px] text-gray-500 font-mono border border-gray-300 dark:border-gray-700 rounded px-1 bg-gray-50 dark:bg-gray-800">
                    {config?.modelId}
                </span>
            )}
          </div>

          <div className={`
            relative group rounded-2xl px-4 py-3 shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words
            ${isUser 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700'}
            ${message.error ? 'border-red-500/50 bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-200' : ''}
          `}>
            
            {message.content || (message.isStreaming ? <span className="animate-pulse">▋</span> : <span className="text-gray-400 italic">{t('app.emptyResponse')}</span>)}
            
            {message.error && (
                <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs mt-2 pt-2 border-t border-red-200 dark:border-red-800/30">
                    <AlertCircle size={12} />
                    <span>{message.error}</span>
                </div>
            )}

            {!message.isStreaming && message.content && (
               <button onClick={handleCopy} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-opacity bg-white/50 dark:bg-black/20 rounded p-1" title={t('common.copy')}>
                 <Copy size={12} />
               </button>
            )}
          </div>
          
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1 flex items-center gap-2">
            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            {message.isStreaming && <span className="text-green-600 dark:text-green-500 animate-pulse font-bold">{t('app.typing')}</span>}
          </div>

        </div>
      </div>
    </div>
  );
};
