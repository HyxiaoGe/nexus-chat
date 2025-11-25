import React, { useRef, useEffect, useState } from 'react';
import { AgentConfig } from '../types';
import { AgentColumn } from './AgentColumn';

interface ResponsiveGridProps {
  agents: AgentConfig[];
  messages: any[];
  onOpenFullscreen: (agentId: string, messageId: string) => void;
  onStopAgent?: (messageId: string) => void;
  onRegenerateAgent?: (messageId: string) => void;
  onCopyMessage?: (content: string) => void;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  agents,
  messages,
  onOpenFullscreen,
  onStopAgent,
  onRegenerateAgent,
  onCopyMessage
}) => {
  const enabledAgents = agents.filter(a => a.enabled);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // 监听容器宽度变化
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 提取用户消息
  const userMessages = messages.filter(m => m.role === 'user');
  const latestUserMessage = userMessages[userMessages.length - 1];

  // 按agent分组消息
  const messagesByAgent = enabledAgents.reduce((acc, agent) => {
    acc[agent.id] = messages.filter(m => m.agentId === agent.id && m.role === 'model');
    return acc;
  }, {} as Record<string, any[]>);

  // 根据AI数量决定布局
  const getGridClasses = () => {
    const count = enabledAgents.length;

    if (count === 0) return '';
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 lg:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2';

    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  // 特殊处理：4个AI使用2x2网格
  const useTwoByTwoGrid = enabledAgents.length === 4;

  if (enabledAgents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400 dark:text-gray-600">
          <p className="text-lg mb-2">没有启用的AI</p>
          <p className="text-sm">请在设置中启用至少一个AI模型</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`
        flex flex-col h-full overflow-auto
        ${useTwoByTwoGrid ? 'p-3' : 'p-4'}
      `}
    >
      {/* 用户提问区域 */}
      {latestUserMessage && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl px-5 py-4 shadow-lg shadow-indigo-500/20 max-w-4xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-indigo-100 mb-1">您的提问</div>
                <p className="text-[15px] leading-7 whitespace-pre-wrap text-indigo-50">
                  {latestUserMessage.content}
                </p>
                <div className="text-xs text-indigo-200/80 mt-2">
                  {new Date(latestUserMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI响应网格 */}
      <div
        className={`
          grid gap-4
          ${getGridClasses()}
          ${useTwoByTwoGrid ? 'grid-rows-2' : 'auto-rows-fr'}
          transition-all duration-300 ease-in-out
        `}
      >
        {enabledAgents.map((agent, index) => (
          <AgentColumn
            key={agent.id}
            agent={agent}
            messages={messagesByAgent[agent.id] || []}
            onOpenFullscreen={onOpenFullscreen}
            onStopAgent={onStopAgent}
            onRegenerateAgent={onRegenerateAgent}
            onCopyMessage={onCopyMessage}
            index={index}
            totalCount={enabledAgents.length}
          />
        ))}
      </div>
    </div>
  );
};
