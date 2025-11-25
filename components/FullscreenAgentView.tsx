import React, { useEffect, useState } from 'react';
import { AgentConfig, Message } from '../types';
import { BrandIcon } from './BrandIcons';
import { SmartContentRenderer } from './SmartContentRenderer';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
  Sparkles,
  Check,
  Clock
} from 'lucide-react';

interface FullscreenAgentViewProps {
  agentId: string;
  message: Message;
  allAgents: AgentConfig[];
  allMessages: Message[];
  onClose: () => void;
  onNavigate: (agentId: string, messageId: string) => void;
  onRegenerateAgent?: (messageId: string) => void;
  onCopyMessage?: (content: string) => void;
}

export const FullscreenAgentView: React.FC<FullscreenAgentViewProps> = ({
  agentId,
  message,
  allAgents,
  allMessages,
  onClose,
  onNavigate,
  onRegenerateAgent,
  onCopyMessage
}) => {
  const [copied, setCopied] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const currentAgent = allAgents.find(a => a.id === agentId);
  const currentIndex = allAgents.findIndex(a => a.id === agentId);

  const prevAgent = currentIndex > 0 ? allAgents[currentIndex - 1] : null;
  const nextAgent = currentIndex < allAgents.length - 1 ? allAgents[currentIndex + 1] : null;

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft' && prevAgent) {
        const prevMessage = allMessages.find(m => m.agentId === prevAgent.id && m.role === 'model');
        if (prevMessage) {
          onNavigate(prevAgent.id, prevMessage.id);
        }
      } else if (e.key === 'ArrowRight' && nextAgent) {
        const nextMessage = allMessages.find(m => m.agentId === nextAgent.id && m.role === 'model');
        if (nextMessage) {
          onNavigate(nextAgent.id, nextMessage.id);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !window.getSelection()?.toString()) {
        // Cmd/Ctrl+C 复制内容（如果没有选中文本）
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allAgents, allMessages, onNavigate, prevAgent, nextAgent]);

  // 关闭动画
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  // 复制内容
  const handleCopy = () => {
    if (onCopyMessage) {
      onCopyMessage(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 重新生成
  const handleRegenerate = () => {
    if (onRegenerateAgent) {
      onRegenerateAgent(message.id);
      handleClose();
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`
        fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col
        ${isExiting ? 'animate-out fade-out zoom-out-95 duration-200' : 'animate-in fade-in zoom-in-95 duration-300'}
      `}
    >
      {/* 顶部导航栏 */}
      <header className="flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：返回按钮 */}
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
              <span className="text-sm font-medium">退出</span>
            </button>

            {/* 中间：AI信息 */}
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <BrandIcon brand={currentAgent?.avatar || ''} className="w-7 h-7" />
              <div className="text-center">
                <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {currentAgent?.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {currentAgent?.modelId}
                </div>
              </div>
            </div>

            {/* 右侧：快捷键提示 */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-mono">
                ESC
              </kbd>
              <span>关闭</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* 时间戳 */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Clock className="w-4 h-4" />
            <span>{formatTime(message.timestamp)}</span>
          </div>

          {/* 消息内容 */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <SmartContentRenderer
              content={message.content}
              isStreaming={false}
            />
          </div>

          {/* Token使用信息 */}
          {message.tokenUsage && (
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Token 使用情况
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {message.tokenUsage.totalTokens.toLocaleString()} tokens
                    </div>
                  </div>
                </div>
                {message.tokenUsage.estimatedCost && message.tokenUsage.estimatedCost > 0 && (
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      ${message.tokenUsage.estimatedCost.toFixed(6)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      预估成本
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">复制内容</span>
                </>
              )}
            </button>

            {onRegenerateAgent && (
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow"
              >
                <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">重新生成</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 底部导航栏 */}
      <footer className="flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 上一个AI */}
            <button
              onClick={() => {
                if (prevAgent) {
                  const prevMessage = allMessages.find(m => m.agentId === prevAgent.id && m.role === 'model');
                  if (prevMessage) {
                    onNavigate(prevAgent.id, prevMessage.id);
                  }
                }
              }}
              disabled={!prevAgent}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              {prevAgent && (
                <div className="flex items-center gap-2">
                  <BrandIcon brand={prevAgent.avatar} className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs text-gray-500 dark:text-gray-400">上一个</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {prevAgent.name}
                    </div>
                  </div>
                </div>
              )}
            </button>

            {/* 页面指示器 */}
            <div className="flex items-center gap-2">
              {allAgents.map((agent, idx) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    const msg = allMessages.find(m => m.agentId === agent.id && m.role === 'model');
                    if (msg) {
                      onNavigate(agent.id, msg.id);
                    }
                  }}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-200
                    ${idx === currentIndex
                      ? 'w-8 bg-blue-600 dark:bg-blue-400'
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                    }
                  `}
                  title={agent.name}
                />
              ))}
            </div>

            {/* 下一个AI */}
            <button
              onClick={() => {
                if (nextAgent) {
                  const nextMessage = allMessages.find(m => m.agentId === nextAgent.id && m.role === 'model');
                  if (nextMessage) {
                    onNavigate(nextAgent.id, nextMessage.id);
                  }
                }
              }}
              disabled={!nextAgent}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
            >
              {nextAgent && (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">下一个</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {nextAgent.name}
                    </div>
                  </div>
                  <BrandIcon brand={nextAgent.avatar} className="w-6 h-6" />
                </div>
              )}
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>
          </div>

          {/* 快捷键提示 */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono">←</kbd>
              <span>上一个</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono">→</kbd>
              <span>下一个</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono">Cmd/Ctrl+C</kbd>
              <span>复制</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
