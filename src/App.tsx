import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Menu,
  Send,
  Settings as SettingsIcon,
  Plus,
  MessageSquare,
  Square,
  Sparkles,
  Zap,
  Code,
  Feather,
  RefreshCw,
  Gift,
  Key,
  Grid3x3,
  Columns2,
} from 'lucide-react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from './i18n';

import { Sidebar } from './components/Sidebar';
import { ModelSettings } from './components/ModelSettings';
import { WelcomeDialog } from './components/WelcomeDialog';
import { ToastProvider, useToast } from './components/Toast';
import { DialogProvider, useConfirm } from './contexts/DialogContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DEFAULT_AGENTS, DEFAULT_PROVIDERS, STORAGE_KEYS, DEFAULT_APP_SETTINGS } from './constants';
import { Message, Session, AgentConfig, LLMProvider, AppSettings } from './types';
import { generateId } from './utils/common';
import { useChatOrchestrator } from './hooks/useChatOrchestrator';
import { useScrollToBottom } from './hooks/useScrollToBottom';
import { useVersionCheck } from './hooks/useVersionCheck';
import { useDebounce } from './hooks/useDebounce';
import { ResponsiveGrid } from './components/ResponsiveGrid';
import { ComparisonView } from './components/ComparisonView';
import { FullscreenAgentView } from './components/FullscreenAgentView';

interface NexusChatProps {
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings) => void;
}

const NexusChat: React.FC<NexusChatProps> = ({ appSettings, setAppSettings }) => {
  const { t, i18n } = useTranslation();
  const confirm = useConfirm();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  // --- State ---
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [agents, setAgents] = useState<AgentConfig[]>(DEFAULT_AGENTS);
  const [providers, setProviders] = useState<LLMProvider[]>(DEFAULT_PROVIDERS);

  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<
    'general' | 'agents' | 'providers' | 'data'
  >('general');
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  // View mode: grid (default) or comparison
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>(() => {
    const saved = localStorage.getItem('nexus_view_mode');
    return (saved === 'comparison' ? 'comparison' : 'grid') as 'grid' | 'comparison';
  });

  // Fullscreen agent view state
  const [fullscreenView, setFullscreenView] = useState<{
    agentId: string;
    messageId: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Suggestions with translation
  const suggestions = [
    {
      icon: <Sparkles size={20} className="text-yellow-500" />,
      label: t('suggestions.creative.label'),
      prompt: t('suggestions.creative.prompt'),
    },
    {
      icon: <Code size={20} className="text-blue-500" />,
      label: t('suggestions.code.label'),
      prompt: t('suggestions.code.prompt'),
    },
    {
      icon: <Zap size={20} className="text-purple-500" />,
      label: t('suggestions.brainstorm.label'),
      prompt: t('suggestions.brainstorm.prompt'),
    },
    {
      icon: <Feather size={20} className="text-green-500" />,
      label: t('suggestions.philosophy.label'),
      prompt: t('suggestions.philosophy.prompt'),
    },
  ];

  // Get session token usage from current session (accumulated, not from messages)
  const sessionTokenUsage = useMemo(() => {
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    return activeSession?.sessionTokenUsage || { totalTokens: 0, totalCost: 0 };
  }, [sessions, activeSessionId]);

  // Check if using free tier (OpenRouter without API key)
  const isUsingFreeTier = useMemo(() => {
    const openRouterProvider = providers.find((p) => p.id === 'provider-openrouter');
    return openRouterProvider && !openRouterProvider.apiKey;
  }, [providers]);

  // Sync language with i18next
  useEffect(() => {
    if (appSettings.language && i18n.language !== appSettings.language) {
      i18n.changeLanguage(appSettings.language);
    }
  }, [appSettings.language, i18n]);

  // Save view mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('nexus_view_mode', viewMode);
  }, [viewMode]);

  // --- Initialization ---
  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    const savedAgents = localStorage.getItem(STORAGE_KEYS.AGENTS);
    const savedProviders = localStorage.getItem(STORAGE_KEYS.PROVIDERS);

    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      setSessions(parsedSessions);
      if (parsedSessions.length > 0) {
        setActiveSessionId(parsedSessions[0].id);
      } else {
        createNewSession();
      }
    } else {
      createNewSession();
    }

    if (savedAgents) setAgents(JSON.parse(savedAgents));
    if (savedProviders) {
      const parsed = JSON.parse(savedProviders);
      // Ensure OpenRouter exists in old configs
      if (!parsed.find((p: LLMProvider) => p.id === 'provider-openrouter')) {
        setProviders([...parsed, DEFAULT_PROVIDERS.find((p) => p.id === 'provider-openrouter')!]);
      } else {
        setProviders(parsed);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount for initialization

  // --- Welcome Dialog Logic ---
  // Show welcome dialog if no API keys are configured
  useEffect(() => {
    const welcomeRemindAt = localStorage.getItem('nexus_welcome_remind_at');

    // Check if user has set a reminder
    if (welcomeRemindAt) {
      const remindTime = parseInt(welcomeRemindAt);
      if (Date.now() < remindTime) {
        // Still within the reminder period, don't show
        return;
      }
    }

    const hasConfiguredKey = providers.some((p) => p.apiKey && p.apiKey.trim().length > 0);
    if (!hasConfiguredKey && providers.length > 0) {
      // Delay showing dialog to avoid flashing during initial load
      const timer = setTimeout(() => setShowWelcomeDialog(true), 500);
      return () => clearTimeout(timer);
    }
  }, [providers]);

  // --- Persistence with Debounce ---
  const debouncedSessions = useDebounce(sessions, 1000);
  const debouncedAgents = useDebounce(agents, 1000);
  const debouncedProviders = useDebounce(providers, 1000);

  useEffect(() => {
    if (debouncedSessions.length > 0 || sessions.length === 0) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(debouncedSessions));
    }
  }, [debouncedSessions, sessions.length]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(debouncedAgents));
  }, [debouncedAgents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(debouncedProviders));
  }, [debouncedProviders]);

  useEffect(() => {
    if (activeSessionId) {
      const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '{}');
      if (allMessages[activeSessionId]) {
        setMessages(allMessages[activeSessionId]);
      } else {
        setMessages([]);
      }
    }
  }, [activeSessionId]);

  const saveMessagesToStorage = (sessionId: string, newMessages: Message[]) => {
    const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '{}');
    allMessages[sessionId] = newMessages;
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
  };

  // --- Scrolling ---
  // Use custom hook for smart scrolling (only auto-scroll if already at bottom)
  const { scrollRef, onScroll, scrollToBottom, showScrollButton: _showScrollButton } =
    useScrollToBottom([messages]);

  // --- Version Check ---
  const { hasUpdate, reloadPage } = useVersionCheck();

  // --- Actions ---
  const createNewSession = () => {
    const newSession: Session = {
      id: generateId(),
      title: t('common.newChat'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const updateSessionTitle = (sessionId: string, title: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s))
    );
  };

  const updateSessionTokenUsage = (
    sessionId: string,
    tokenUsage: { totalTokens: number; totalCost: number }
  ) => {
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === sessionId) {
          const currentUsage = s.sessionTokenUsage || { totalTokens: 0, totalCost: 0 };
          return {
            ...s,
            sessionTokenUsage: {
              totalTokens: currentUsage.totalTokens + tokenUsage.totalTokens,
              totalCost: currentUsage.totalCost + tokenUsage.totalCost,
            },
            updatedAt: Date.now(),
          };
        }
        return s;
      });
      // Persist sessions to localStorage
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
      return updated;
    });
  };

  // --- Hooks ---
  const {
    isStreaming,
    sendMessage,
    regenerateResponses: _regenerateResponses,
    regenerateSingleAgent,
    stopGeneration,
    stopAgent,
  } = useChatOrchestrator({
    activeSessionId,
    agents,
    providers,
    messages,
    setMessages,
    saveMessagesToStorage,
    onScrollToBottom: scrollToBottom,
    updateSessionTitle,
    updateSessionTokenUsage,
    showToast: toastInfo,
  });

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter((s) => s.id !== id);
    setSessions(newSessions);

    const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '{}');
    delete allMessages[id];
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));

    if (activeSessionId === id) {
      if (newSessions.length > 0) {
        setActiveSessionId(newSessions[0].id);
      } else {
        // Last session deleted - clear everything
        setActiveSessionId(null);
        setMessages([]);
      }
    }
  };

  const onSend = () => {
    sendMessage(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // Handle editing user message
  const _handleEditMessage = (messageId: string, newContent: string) => {
    // Find the message index
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // Remove all messages after this one (including AI responses)
    const updatedMessages = messages.slice(0, messageIndex + 1);

    // Update the message content
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: newContent,
      timestamp: Date.now(),
    };

    // Save updated messages
    setMessages(updatedMessages);
    if (activeSessionId) {
      saveMessagesToStorage(activeSessionId, updatedMessages);
    }

    // Resend the edited message
    sendMessage(newContent);
  };

  // Handle regenerating AI response
  const handleRegenerateMessage = (messageId: string) => {
    // Find the AI message that needs to be regenerated
    const targetMessage = messages.find((m) => m.id === messageId);
    if (!targetMessage || targetMessage.role !== 'model' || !targetMessage.agentId) return;

    const targetAgentId = targetMessage.agentId;

    // Find the preceding user message for this AI response
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }

    if (userMessageIndex < 0) return;
    const userMessage = messages[userMessageIndex];

    // Find all AI responses from the same round (after this user message, before next user message)
    let nextUserMessageIndex = userMessageIndex + 1;
    while (
      nextUserMessageIndex < messages.length &&
      messages[nextUserMessageIndex].role !== 'user'
    ) {
      nextUserMessageIndex++;
    }

    // Only remove the specific agent's response from this round
    const updatedMessages = messages.filter((m, idx) => {
      // Keep all messages outside this round
      if (idx <= userMessageIndex || idx >= nextUserMessageIndex) return true;
      // Within this round, only remove messages from the target agent
      return m.agentId !== targetAgentId;
    });

    // Save updated messages
    setMessages(updatedMessages);
    if (activeSessionId) {
      saveMessagesToStorage(activeSessionId, updatedMessages);
    }

    // Regenerate only for this specific agent
    regenerateSingleAgent(userMessage.content, targetAgentId);
  };

  // Alias for new components
  const regenerateAgent = handleRegenerateMessage;

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Small delay to allow state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (appSettings.enterToSend) {
        e.preventDefault();
        onSend();
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  // --- Fullscreen Agent View ---
  const openFullscreenView = (agentId: string, messageId: string) => {
    setFullscreenView({ agentId, messageId });
  };

  const closeFullscreenView = () => {
    setFullscreenView(null);
  };

  const navigateToAgent = (agentId: string, messageId: string) => {
    setFullscreenView({ agentId, messageId });
  };

  // --- Data Management ---
  const handleExportData = () => {
    const data = {
      sessions,
      messages: JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '{}'),
      agents,
      providers,
      settings: appSettings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-chat-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Validate data structure
        if (!data.sessions || !data.agents || !data.providers) {
          toastError(t('settings.data.importError'));
          return;
        }

        // Import data
        if (data.sessions) setSessions(data.sessions);
        if (data.messages)
          localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(data.messages));
        if (data.agents) setAgents(data.agents);
        if (data.providers) setProviders(data.providers);
        if (data.settings) setAppSettings(data.settings);

        toastSuccess(t('settings.data.importSuccess'));

        // Reset file input
        event.target.value = '';
      } catch (error) {
        console.error('Import error:', error);
        toastError(t('settings.data.importError'));
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    const isConfirmed = await confirm({
      title: t('settings.data.clear'),
      description: t('settings.data.confirmClear'),
      variant: 'danger',
      confirmLabel: t('settings.data.clear'),
    });
    if (isConfirmed) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setIsSidebarOpen(false);
        }}
        onCreateSession={createNewSession}
        onDeleteSession={deleteSession}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 flex flex-col h-full relative min-w-0 transition-all duration-300 bg-gray-50 dark:bg-[#0B0F17]">
        {/* Header - Minimalist & Glass */}
        <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-20 bg-white/60 dark:bg-gray-950/60 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm md:text-base truncate max-w-[200px] md:max-w-md">
                {sessions.find((s) => s.id === activeSessionId)?.title || t('sidebar.newChat')}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <MessageSquare size={10} />{' '}
                  {t('app.activeAgents_other', { count: agents.filter((a) => a.enabled).length })}
                </span>
                <button
                  onClick={() => {
                    setSettingsSection('providers');
                    setIsSettingsOpen(true);
                  }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full font-medium cursor-pointer transition-colors ${
                    isUsingFreeTier
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                      : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                  }`}
                  title={isUsingFreeTier ? t('freeTier.usingFree') : t('freeTier.usingOwn')}
                >
                  {isUsingFreeTier ? <Gift size={10} /> : <Key size={10} />}
                  {isUsingFreeTier ? t('freeTier.badge') : t('freeTier.badgeOwn')}
                </button>
                {sessionTokenUsage.totalTokens > 0 && (
                  <div className="relative group/token">
                    <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium cursor-help">
                      <svg
                        className="w-2.5 h-2.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span>{sessionTokenUsage.totalTokens.toLocaleString()} tokens</span>
                      {sessionTokenUsage.totalCost > 0 && (
                        <span className="text-green-600 dark:text-green-400">
                          • ${sessionTokenUsage.totalCost.toFixed(4)}
                        </span>
                      )}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900/95 dark:bg-black/95 backdrop-blur text-white text-xs rounded-xl opacity-0 group-hover/token:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl border border-gray-700">
                      <div className="font-bold mb-2 text-gray-200 uppercase text-[10px] tracking-wider">
                        📊 本次会话统计
                      </div>
                      <div className="space-y-1.5 text-gray-300 leading-relaxed">
                        <div>
                          <span className="text-blue-400">Token:</span>{' '}
                          本次对话所有AI回复消耗的token总数
                        </div>
                        {sessionTokenUsage.totalCost > 0 && (
                          <div>
                            <span className="text-green-400">成本:</span>{' '}
                            基于OpenRouter定价的估算费用（美元）
                          </div>
                        )}
                        <div className="pt-1 border-t border-gray-700 text-[10px] text-gray-400">
                          💡 提示: 刷新页面或切换会话后重新计算
                        </div>
                      </div>
                      <div className="absolute bottom-full left-4 -mb-1 border-4 border-transparent border-b-gray-900/95"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle - Only show when there are messages */}
            {messages.length > 0 && (
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  title="网格视图"
                >
                  <Grid3x3 size={14} />
                  <span className="hidden sm:inline">网格</span>
                </button>
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                    viewMode === 'comparison'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  title="对比视图"
                >
                  <Columns2 size={14} />
                  <span className="hidden sm:inline">对比</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 border border-gray-200 dark:border-gray-800/50 rounded-full transition-all hover:shadow-sm"
            >
              <SettingsIcon size={16} className="text-blue-500 dark:text-blue-400" />
              <span className="hidden sm:inline">{t('app.settings')}</span>
            </button>
          </div>
        </header>

        {/* UPDATE NOTIFICATION */}
        {hasUpdate && (
          <div className="absolute top-20 right-4 z-50 animate-in fade-in slide-in-from-right-10 duration-500">
            <div className="flex items-center gap-3 p-3 bg-blue-600 text-white rounded-xl shadow-xl shadow-blue-500/30 border border-blue-500 backdrop-blur-md">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                  {t('app.updateAvailable')}
                </span>
                <span className="text-xs opacity-80">{t('app.clickToRefresh')}</span>
              </div>
              <button
                onClick={reloadPage}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
                title={t('app.refresh')}
              >
                <RefreshCw
                  size={18}
                  className="animate-spin-slow"
                  style={{ animationDuration: '3s' }}
                />
              </button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden pt-16 relative">
          {messages.length === 0 ? (
            <div
              ref={scrollRef}
              onScroll={onScroll}
              className="h-full overflow-y-auto scroll-smooth px-4 md:px-6"
            >
              <div className="max-w-5xl mx-auto w-full h-full flex items-center justify-center">
                {/* Empty State: Welcome message and suggestions */}
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500 px-4">
                  <div className="space-y-4">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20 rotate-3 transform transition-transform hover:rotate-6">
                      <Plus size={48} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                      {t('app.welcomeTitle')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                      {t('app.welcomeSubtitle')}
                    </p>
                  </div>

                  {/* Suggestions Carousel */}
                  <div className="w-full max-w-3xl mt-8">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      {t('app.startSuggestion')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(s.prompt)}
                          className="group p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 flex items-start gap-3"
                        >
                          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg group-hover:scale-110 transition-transform">
                            {s.icon}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                              {s.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {s.prompt}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View - Responsive Grid Layout
            <ResponsiveGrid
              agents={agents.filter((a) => a.enabled)}
              messages={messages}
              onOpenFullscreen={openFullscreenView}
              onStopAgent={stopAgent}
              onRegenerateAgent={regenerateAgent}
              onCopyMessage={(content) => {
                navigator.clipboard.writeText(content);
                toastSuccess(t('common.copied'));
              }}
            />
          ) : (
            // Comparison View - Side by Side Layout
            <ComparisonView
              agents={agents.filter((a) => a.enabled)}
              messages={messages}
              onOpenFullscreen={openFullscreenView}
              onStopAgent={stopAgent}
              onRegenerateAgent={regenerateAgent}
              onCopyMessage={(content) => {
                navigator.clipboard.writeText(content);
                toastSuccess(t('common.copied'));
              }}
            />
          )}
        </div>

        {/* Floating Input Bar (Cockpit) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-[#0B0F17] dark:via-[#0B0F17] dark:to-transparent z-30 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            {/* Gradient border wrapper */}
            <div className="relative rounded-[2rem] p-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent focus-within:from-blue-500 focus-within:via-purple-500 focus-within:to-blue-500 transition-all duration-500 shadow-2xl shadow-blue-900/5 dark:shadow-black/50">
              <div className="relative group rounded-[2rem] bg-white dark:bg-[#151b26] transition-all">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder={t('app.inputPlaceholder')}
                  disabled={isStreaming}
                  rows={1}
                  className="w-full bg-transparent text-gray-900 dark:text-white rounded-[2rem] pl-6 pr-14 py-4 max-h-[200px] resize-none focus:outline-none scrollbar-hide placeholder:text-gray-400"
                  style={{ minHeight: '60px' }}
                />

                <div className="absolute right-2 bottom-2">
                  {isStreaming ? (
                    <button
                      onClick={stopGeneration}
                      className="p-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
                      title={t('app.stop')}
                    >
                      <Square size={20} fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      onClick={onSend}
                      disabled={!input.trim()}
                      className={`relative p-2.5 rounded-full transition-all duration-200 flex items-center justify-center ${!input.trim() ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/50 hover:shadow-purple-500/50 hover:scale-110 active:scale-95'}`}
                    >
                      <Send size={20} className={input.trim() ? 'ml-0.5' : ''} />
                      {input.trim() && (
                        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-md opacity-50 -z-10 animate-pulse"></span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="text-center mt-3">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-600 tracking-wide uppercase">
                {isStreaming
                  ? t('app.generating')
                  : appSettings.enterToSend
                    ? t('app.enterToSend')
                    : t('app.ctrlToSend')}
              </span>
            </div>
          </div>
        </div>

        <ModelSettings
          agents={agents}
          providers={providers}
          settings={appSettings}
          onUpdateAgents={setAgents}
          onUpdateProviders={setProviders}
          onUpdateSettings={setAppSettings}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onClearData={handleClearData}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          initialSection={settingsSection}
        />

        <WelcomeDialog
          isOpen={showWelcomeDialog}
          onClose={() => {
            setShowWelcomeDialog(false);
          }}
          onRemindLater={() => {
            setShowWelcomeDialog(false);
            // Set reminder for 1 hour later
            const oneHourLater = Date.now() + 1 * 60 * 60 * 1000;
            localStorage.setItem('nexus_welcome_remind_at', oneHourLater.toString());
          }}
          onOpenSettings={() => {
            setSettingsSection('providers');
            setIsSettingsOpen(true);
          }}
        />
      </main>

      {/* Fullscreen Agent View */}
      {fullscreenView &&
        (() => {
          const message = messages.find((m) => m.id === fullscreenView.messageId);
          if (!message) return null;

          return (
            <FullscreenAgentView
              agentId={fullscreenView.agentId}
              message={message}
              allAgents={agents.filter((a) => a.enabled)}
              allMessages={messages}
              onClose={closeFullscreenView}
              onNavigate={navigateToAgent}
              onRegenerateAgent={regenerateAgent}
              onCopyMessage={(content) => {
                navigator.clipboard.writeText(content);
                toastSuccess(t('common.copied'));
              }}
            />
          );
        })()}
    </div>
  );
};

const App = () => {
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_APP_SETTINGS;
  });

  useEffect(() => {
    if (appSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appSettings.theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
  }, [appSettings]);

  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <ToastProvider>
          <DialogProvider>
            <NexusChat appSettings={appSettings} setAppSettings={setAppSettings} />
          </DialogProvider>
        </ToastProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
};

export default App;
