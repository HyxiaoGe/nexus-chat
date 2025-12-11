import React, { useRef, useEffect, useState } from 'react';
import { AgentConfig, Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { BrandIcon } from './BrandIcons';
import { Loader2, MessageSquare, ArrowDown, Maximize2, Sparkles } from 'lucide-react';

interface AgentColumnProps {
  agent: AgentConfig;
  messages: Message[];
  onOpenFullscreen: (agentId: string, messageId: string) => void;
  onStopAgent?: (messageId: string) => void;
  onRegenerateAgent?: (messageId: string) => void;
  onCopyMessage?: (content: string) => void;
  onRateMessage?: (messageId: string, rating: number) => void;
  onMarkAsBest?: (messageId: string) => void;
  index: number;
  totalCount: number;
}

export const AgentColumn: React.FC<AgentColumnProps> = ({
  agent,
  messages,
  onOpenFullscreen,
  onStopAgent,
  onRegenerateAgent,
  onCopyMessage,
  onRateMessage,
  onMarkAsBest,
  index,
  totalCount: _totalCount,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // 只关注AI消息
  const aiMessages = messages.filter((m) => m.role === 'model');
  const latestMessage = aiMessages[aiMessages.length - 1];
  const isStreaming = latestMessage?.isStreaming;
  const hasContent = aiMessages.length > 0;

  // 智能滚动：新消息时自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      // 检查是否有新的用户消息（表示新一轮对话开始）
      const userMessages = messages.filter((m) => m.role === 'user');
      const hasNewUserMessage = userMessages.length > 0;

      // 如果是新一轮对话或用户在底部，自动滚动
      if (hasNewUserMessage || isNearBottom) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
        // 重置为底部状态
        setIsNearBottom(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]); // Only depend on messages to avoid infinite loop

  // 监听滚动位置
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;

    setIsNearBottom(nearBottom);
    setShowScrollButton(!nearBottom && scrollHeight > clientHeight);
  };

  // 滚动到底部
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // 处理展开全屏
  const handleOpenFullscreen = () => {
    if (latestMessage) {
      onOpenFullscreen(agent.id, latestMessage.id);
    }
  };

  // 动画延迟，让每列依次出现
  const animationDelay = `${index * 50}ms`;

  return (
    <div
      className="group relative flex flex-col min-h-[600px] max-h-[600px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
      style={{
        animation: 'slideInUp 0.4s ease-out',
        animationDelay,
        animationFillMode: 'both',
      }}
    >
      {/* 顶部渐变装饰条 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* 固定头部：Agent信息 */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <BrandIcon brand={agent.avatar} className="w-8 h-8" />
              {/* 流式输出时的波纹扩散效果 */}
              {isStreaming && (
                <>
                  <div
                    className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75"
                    style={{ animationDuration: '1.5s' }}
                  />
                  <div
                    className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse"
                    style={{ animationDuration: '1s' }}
                  />
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                {agent.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {agent.modelId}
              </div>
            </div>
          </div>

          {/* 状态指示器 */}
          <div className="flex items-center gap-2">
            {isStreaming && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">输出中</span>
              </div>
            )}

            {/* 展开按钮 - 仅在有内容且不在流式输出时显示 */}
            {hasContent && !isStreaming && (
              <button
                onClick={handleOpenFullscreen}
                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                title="全屏查看"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Token使用信息 - 如果有的话 */}
        {latestMessage?.tokenUsage && !isStreaming && (
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {latestMessage.tokenUsage.totalTokens.toLocaleString()} tokens
            </span>
            {latestMessage.tokenUsage.estimatedCost &&
              latestMessage.tokenUsage.estimatedCost > 0 && (
                <span className="text-green-600 dark:text-green-400">
                  ≈ ${latestMessage.tokenUsage.estimatedCost.toFixed(6)}
                </span>
              )}
          </div>
        )}
      </div>

      {/* 消息滚动区域 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(203 213 225) transparent',
        }}
      >
        {messages.filter((m) => m.role === 'model').length === 0 ? (
          // 空状态
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full w-16 h-16 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">等待回复...</p>
            </div>
          </div>
        ) : (
          // 消息列表
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <MessageBubble
                  message={message}
                  config={agent}
                  onStopAgent={onStopAgent}
                  onRegenerateAgent={onRegenerateAgent}
                  onCopyMessage={onCopyMessage}
                  onRateMessage={message.role === 'model' ? onRateMessage : undefined}
                  onMarkAsBest={message.role === 'model' ? onMarkAsBest : undefined}
                  isInColumn={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 滚动到底部按钮 */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-20 p-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 border border-gray-200 dark:border-gray-600"
          style={{
            animation: 'slideInUp 0.3s ease-out',
          }}
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
