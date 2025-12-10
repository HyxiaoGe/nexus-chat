import React, { useRef, useEffect, useState } from 'react';
import { AgentConfig, Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { BrandIcon } from './BrandIcons';
import { Loader2, MessageSquare, Square, RefreshCw, Copy, Maximize2 } from 'lucide-react';

interface ComparisonViewProps {
  agents: AgentConfig[];
  messages: Message[];
  onOpenFullscreen: (agentId: string, messageId: string) => void;
  onStopAgent?: (messageId: string) => void;
  onRegenerateAgent?: (messageId: string) => void;
  onCopyMessage: (content: string) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  agents,
  messages,
  onOpenFullscreen,
  onStopAgent,
  onRegenerateAgent,
  onCopyMessage,
}) => {
  const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [syncScroll, setSyncScroll] = useState(true);
  const isScrollingRef = useRef(false);

  const enabledAgents = agents.filter((a) => a.enabled);

  // Group messages by agent
  const messagesByAgent = enabledAgents.reduce(
    (acc, agent) => {
      acc[agent.id] = messages.filter(
        (m) => m.role === 'user' || (m.agentId === agent.id && m.role === 'model')
      );
      return acc;
    },
    {} as Record<string, Message[]>
  );

  // Synchronized scrolling
  const handleScroll = (index: number) => {
    if (!syncScroll || isScrollingRef.current) return;

    const source = scrollRefs.current[index];
    if (!source) return;

    isScrollingRef.current = true;

    scrollRefs.current.forEach((ref, i) => {
      if (i !== index && ref) {
        const scrollPercentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
        ref.scrollTop = scrollPercentage * (ref.scrollHeight - ref.clientHeight);
      }
    });

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 50);
  };

  // Determine layout based on agent count
  const gridCols = enabledAgents.length === 1 ? 1 : enabledAgents.length === 2 ? 2 : 2;
  const gridRows = enabledAgents.length <= 2 ? 1 : 2;

  return (
    <div className="h-full flex flex-col">
      {/* Sync toggle */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={syncScroll}
            onChange={(e) => setSyncScroll(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="font-medium">同步滚动</span>
        </label>
      </div>

      {/* Comparison Grid */}
      <div
        className={`flex-1 grid gap-3 p-3 overflow-hidden`}
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
        }}
      >
        {enabledAgents.map((agent, index) => {
          const agentMessages = messagesByAgent[agent.id] || [];
          const aiMessages = agentMessages.filter((m) => m.role === 'model');
          const latestMessage = aiMessages[aiMessages.length - 1];
          const isStreaming = latestMessage?.isStreaming;

          return (
            <div
              key={agent.id}
              className="flex flex-col bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              {/* Agent Header */}
              <div className="flex-shrink-0 px-4 py-3 border-b-2 border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <BrandIcon brand={agent.avatar} className="w-6 h-6 text-white" />
                      </div>
                      {isStreaming && (
                        <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">
                        {agent.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {agent.modelId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isStreaming && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          输出中
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={(el) => (scrollRefs.current[index] = el)}
                onScroll={() => handleScroll(index)}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgb(203 213 225) transparent',
                }}
              >
                {aiMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="mx-auto mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full w-16 h-16 flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-400 dark:text-gray-500">等待回复...</p>
                    </div>
                  </div>
                ) : (
                  agentMessages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      config={msg.role === 'model' ? agent : undefined}
                      onCopyMessage={onCopyMessage}
                      onRegenerateAgent={
                        msg.role === 'model' && onRegenerateAgent
                          ? onRegenerateAgent
                          : undefined
                      }
                      onStopAgent={
                        msg.role === 'model' && msg.isStreaming && onStopAgent
                          ? onStopAgent
                          : undefined
                      }
                      isInColumn={true}
                    />
                  ))
                )}
              </div>

              {/* Agent Actions */}
              {latestMessage && (
                <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {latestMessage.tokenUsage && (
                        <span className="text-gray-600 dark:text-gray-400">
                          {latestMessage.tokenUsage.totalTokens.toLocaleString()} tokens
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {latestMessage.isStreaming && onStopAgent ? (
                        <button
                          onClick={() => onStopAgent(latestMessage.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="停止生成"
                        >
                          <Square size={14} />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onCopyMessage(latestMessage.content)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="复制"
                          >
                            <Copy size={14} />
                          </button>
                          {onRegenerateAgent && (
                            <button
                              onClick={() => onRegenerateAgent(latestMessage.id)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                              title="重新生成"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenFullscreen(agent.id, latestMessage.id)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="全屏查看"
                          >
                            <Maximize2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
