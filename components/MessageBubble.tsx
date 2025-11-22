
import React from 'react';
import { Message, AgentConfig } from '../types';
import { User, Copy, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SmartContentRenderer } from './SmartContentRenderer';
import { BrandIcon } from './BrandIcons';

interface MessageBubbleProps {
  message: Message;
  config?: AgentConfig;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, config }) => {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  // Helper to determine what to render for avatar
  const renderAvatar = () => {
      if (isUser) return <User size={20} />;
      
      const avatarStr = config?.avatar || 'other';
      
      // 1. Check if it's a URL (custom user avatar)
      if (avatarStr.startsWith('http') || avatarStr.startsWith('data:')) {
          return <img src={avatarStr} alt={config?.name} className="w-full h-full object-cover" />;
      }
      
      // 2. Check if it's a known brand key (Official Icon)
      // We assume anything else that isn't an emoji is a brand key
      // Simple heuristic: If it's long and has no emoji-like chars, or matches our known keys
      return <BrandIcon brand={avatarStr} size={22} />;
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] lg:max-w-[80%] gap-3 md:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
            flex-shrink-0 w-9 h-9 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shadow-md border overflow-hidden
            ${isUser 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-white dark:bg-[#1e2530] border-gray-200 dark:border-gray-700/50'}
        `}>
          {renderAvatar()}
        </div>

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0 w-full max-w-full`}>
          
          {/* Header Info */}
          <div className={`flex items-center gap-2 mb-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
            <span className={`text-sm font-bold tracking-tight ${isUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-200'}`}>
              {isUser ? t('common.you') : config?.name || t('app.configError')}
            </span>
            
            {!isUser && config && (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 font-mono border border-gray-200 dark:border-gray-700/50 rounded px-1.5 py-0.5 bg-gray-100/50 dark:bg-gray-800/50">
                        {config.modelId}
                    </span>
                    {/* System Prompt Tooltip */}
                    <div className="relative group/info">
                        <Info size={13} className="text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 cursor-help transition-colors" />
                        <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-gray-900/95 dark:bg-black/95 backdrop-blur text-white text-xs rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-10 shadow-2xl border border-gray-700">
                             <div className="font-bold mb-1.5 text-gray-300 uppercase text-[10px] tracking-wider">{t('app.systemPrompt')}</div>
                             <div className="line-clamp-6 italic text-gray-300 font-serif leading-relaxed">{config.systemPrompt}</div>
                             {/* Arrow */}
                             <div className="absolute top-full left-1.5 -mt-1 border-4 border-transparent border-t-gray-900/95"></div>
                        </div>
                    </div>
                </div>
            )}
          </div>

          {/* Bubble Content */}
          <div className={`
            relative group rounded-[1.25rem] px-5 md:px-6 py-4 md:py-5 shadow-sm text-[15px] md:text-[16px] leading-7 break-words w-full transition-all duration-200
            ${isUser 
                ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-indigo-500/20' 
                : 'bg-white dark:bg-[#151b26] text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-gray-200/50 dark:shadow-black/20'}
            ${message.error ? 'border-red-500/50 bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-200' : ''}
          `}>
            
            {message.content || message.isStreaming ? (
                 isUser ? (
                     <p className="whitespace-pre-wrap leading-7 tracking-wide text-indigo-50">{message.content}</p>
                 ) : (
                     <SmartContentRenderer content={message.content} isStreaming={message.isStreaming} />
                 )
            ) : (
                <span className="text-gray-400 italic flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    {t('app.emptyResponse')}
                </span>
            )}
            
            {message.isStreaming && !message.content && <span className="animate-pulse inline-block w-2 h-4 bg-gray-400 ml-1 align-middle rounded-full"></span>}
            
            {message.error && (
                <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs mt-3 pt-3 border-t border-red-200 dark:border-red-800/30 font-medium">
                    <AlertCircle size={14} />
                    <span>{message.error}</span>
                </div>
            )}

            {!message.isStreaming && message.content && !isUser && (
               <button onClick={handleCopy} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-1.5" title={t('common.copy')}>
                 <Copy size={14} />
               </button>
            )}
          </div>
          
          {/* Footer Timestamp */}
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 px-2 flex items-center gap-2 select-none opacity-80">
            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            {message.isStreaming && <span className="text-blue-600 dark:text-blue-400 animate-pulse font-semibold flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
               {t('app.typing')}
            </span>}
          </div>

        </div>
      </div>
    </div>
  );
};
