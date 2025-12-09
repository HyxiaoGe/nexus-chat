import React, { useRef, useEffect, useState } from 'react';
import { AgentConfig, Message } from '../types';
import { AgentColumn } from './AgentColumn';

interface ResponsiveGridProps {
  agents: AgentConfig[];
  messages: Message[];
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
  onCopyMessage,
}) => {
  const enabledAgents = agents.filter((a) => a.enabled);
  const containerRef = useRef<HTMLDivElement>(null);
  const [_containerWidth, setContainerWidth] = useState(0);

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

  // 按agent分组消息，包含对应的用户问题
  const messagesByAgent = enabledAgents.reduce(
    (acc, agent) => {
      acc[agent.id] = messages.filter(
        (m) => m.role === 'user' || (m.agentId === agent.id && m.role === 'model')
      );
      return acc;
    },
    {} as Record<string, Message[]>
  );

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
        h-full overflow-y-auto
        ${useTwoByTwoGrid ? 'p-3' : 'p-4'}
      `}
    >
      <div
        className={`
          grid gap-4
          ${getGridClasses()}
          ${useTwoByTwoGrid ? 'auto-rows-auto' : 'auto-rows-fr'}
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
