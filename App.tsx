
import React, { useState, useEffect, useRef } from 'react';
import { Menu, Send, Settings as SettingsIcon, Plus, MessageSquare, Square, ArrowDown, Sparkles, Zap, Code, Feather, RefreshCw } from 'lucide-react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from './i18n';

import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { ModelSettings } from './components/ModelSettings';
import { ToastProvider } from './components/Toast';
import { DialogProvider } from './contexts/DialogContext';
import { DEFAULT_AGENTS, DEFAULT_PROVIDERS, STORAGE_KEYS, DEFAULT_APP_SETTINGS } from './constants';
import { Message, Session, AgentConfig, LLMProvider, AppSettings } from './types';
import { generateId } from './utils/common';
import { useChatOrchestrator } from './hooks/useChatOrchestrator';
import { useScrollToBottom } from './hooks/useScrollToBottom';
import { useVersionCheck } from './hooks/useVersionCheck';
import { BrandIcon } from './components/BrandIcons';

interface NexusChatProps {
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings) => void;
}

const NexusChat: React.FC<NexusChatProps> = ({ appSettings, setAppSettings }) => {
  const { t, i18n } = useTranslation();
  
  // --- State ---
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [agents, setAgents] = useState<AgentConfig[]>(DEFAULT_AGENTS);
  const [providers, setProviders] = useState<LLMProvider[]>(DEFAULT_PROVIDERS);
  
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Suggestions with translation
  const suggestions = [
      { icon: <Sparkles size={20} className="text-yellow-500" />, label: t('suggestions.creative.label'), prompt: t('suggestions.creative.prompt') },
      { icon: <Code size={20} className="text-blue-500" />, label: t('suggestions.code.label'), prompt: t('suggestions.code.prompt') },
      { icon: <Zap size={20} className="text-purple-500" />, label: t('suggestions.brainstorm.label'), prompt: t('suggestions.brainstorm.prompt') },
      { icon: <Feather size={20} className="text-green-500" />, label: t('suggestions.philosophy.label'), prompt: t('suggestions.philosophy.prompt') },
  ];

  // Sync language with i18next
  useEffect(() => {
    if (appSettings.language && i18n.language !== appSettings.language) {
      i18n.changeLanguage(appSettings.language);
    }
  }, [appSettings.language, i18n]);

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
            setProviders([...parsed, DEFAULT_PROVIDERS.find(p => p.id === 'provider-openrouter')!]);
        } else {
            setProviders(parsed);
        }
    }
  }, []);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents)); }, [agents]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers)); }, [providers]);

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
  const { scrollRef, onScroll, scrollToBottom, showScrollButton } = useScrollToBottom([messages]);

  // --- Version Check ---
  const { hasUpdate, reloadPage } = useVersionCheck();

  // --- Hooks ---
  const { isStreaming, sendMessage, stopGeneration } = useChatOrchestrator({
      activeSessionId,
      agents,
      providers,
      messages,
      setMessages,
      saveMessagesToStorage,
      onScrollToBottom: scrollToBottom
  });

  // --- Actions ---
  const createNewSession = () => {
    const newSession: Session = {
      id: generateId(),
      title: `${t('common.create')} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    
    const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '{}');
    delete allMessages[id];
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));

    if (activeSessionId === id) {
      setActiveSessionId(newSessions.length > 0 ? newSessions[0].id : null);
    }
  };

  const onSend = () => {
      sendMessage(input);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

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

  // --- Data Management ---
  const handleExportData = () => {
      const data = {
          sessions,
          messages: JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '{}'),
          agents,
          providers,
          settings: appSettings
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-chat-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
      if (confirm(t('settings.data.confirmClear'))) {
          localStorage.clear();
          window.location.reload();
      }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden">
      
      <Sidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
        onCreateSession={createNewSession}
        onDeleteSession={deleteSession}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 flex flex-col h-full relative min-w-0 transition-all duration-300 bg-gray-50 dark:bg-[#0B0F17]">
        {/* Header - Minimalist & Glass */}
        <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-20 bg-white/60 dark:bg-gray-950/60 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Menu size={20} />
            </button>
            <div className="flex flex-col">
                <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm md:text-base truncate max-w-[200px] md:max-w-md">
                    {sessions.find(s => s.id === activeSessionId)?.title || t('sidebar.newChat')}
                </h2>
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <MessageSquare size={10} /> {t('app.activeAgents_other', { count: agents.filter(a => a.enabled).length })}
                </span>
            </div>
          </div>
          
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 border border-gray-200 dark:border-gray-800/50 rounded-full transition-all hover:shadow-sm">
            <SettingsIcon size={16} className="text-blue-500 dark:text-blue-400" />
            <span className="hidden sm:inline">{t('app.settings')}</span>
          </button>
        </header>

        {/* UPDATE NOTIFICATION */}
        {hasUpdate && (
          <div className="absolute top-20 right-4 z-50 animate-in fade-in slide-in-from-right-10 duration-500">
             <div className="flex items-center gap-3 p-3 bg-blue-600 text-white rounded-xl shadow-xl shadow-blue-500/30 border border-blue-500 backdrop-blur-md">
                 <div className="flex flex-col">
                     <span className="text-xs font-bold uppercase tracking-wider opacity-90">{t('app.updateAvailable')}</span>
                     <span className="text-xs opacity-80">{t('app.clickToRefresh')}</span>
                 </div>
                 <button 
                    onClick={reloadPage}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
                    title={t('app.refresh')}
                 >
                     <RefreshCw size={18} className="animate-spin-slow" style={{ animationDuration: '3s' }} />
                 </button>
             </div>
          </div>
        )}

        {/* Chat Area */}
        <div 
            ref={scrollRef}
            onScroll={onScroll}
            className="flex-1 overflow-y-auto pt-20 pb-32 px-4 md:px-0 scroll-smooth relative"
        >
          <div className="max-w-4xl mx-auto w-full">
              {messages.length === 0 ? (
                /* Empty State Carousel */
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500 px-4">
                    <div className="space-y-4">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20 rotate-3 transform transition-transform hover:rotate-6">
                            <Plus size={48} className="text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">{t('app.welcomeTitle')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                           {t('app.welcomeSubtitle')}
                        </p>
                    </div>

                    {/* Suggestions Carousel */}
                    <div className="w-full max-w-3xl mt-8">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{t('app.startSuggestion')}</p>
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
                                        <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{s.label}</div>
                                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">{s.prompt}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
              ) : (
                /* Message Stream */
                <div className="space-y-8 pb-4">
                    {messages.map((msg) => {
                        // Logic to delay showing agent bubble until content starts streaming or error occurs
                        if (msg.role === 'model' && msg.isStreaming && !msg.content && !msg.error) {
                            return null;
                        }

                        return (
                          <MessageBubble 
                            key={msg.id} 
                            message={msg} 
                            config={agents.find(a => a.id === msg.agentId)}
                          />
                        );
                    })}

                    {/* Pending Agents "Typing" Indicators */}
                    {(() => {
                        const pendingAgents = messages.filter(m => m.role === 'model' && m.isStreaming && !m.content && !m.error);
                        if (pendingAgents.length === 0) return null;

                        return (
                            <div className="space-y-3 pt-2 animate-in fade-in duration-500">
                                {pendingAgents.map(msg => {
                                    const agent = agents.find(a => a.id === msg.agentId);
                                    if (!agent) return null;
                                    
                                    const isUrl = agent.avatar?.startsWith('http') || agent.avatar?.startsWith('data:');
                                    
                                    return (
                                        <div key={msg.id} className="flex w-full justify-start">
                                            <div className="flex items-center gap-3 md:gap-4 pl-1">
                                                {/* Ghost Avatar */}
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center opacity-60 grayscale">
                                                    {isUrl ? (
                                                        <img src={agent.avatar} className="w-full h-full object-cover rounded-2xl" alt="typing" />
                                                    ) : (
                                                        <BrandIcon brand={agent.avatar || 'other'} size={18} />
                                                    )}
                                                </div>
                                                
                                                {/* Typing Status */}
                                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 bg-white/40 dark:bg-gray-800/40 px-3 py-1.5 rounded-full">
                                                    <span className="font-semibold">{agent.name}</span>
                                                    <span className="flex gap-1 items-center">
                                                        <span className="w-1 h-1 bg-current rounded-full animate-bounce"></span>
                                                        <span className="w-1 h-1 bg-current rounded-full animate-bounce delay-75"></span>
                                                        <span className="w-1 h-1 bg-current rounded-full animate-bounce delay-150"></span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    })()}
                </div>
              )}
          </div>
          
          {/* Floating Scroll Button */}
          {showScrollButton && (
            <button
              onClick={() => scrollToBottom()}
              className="fixed bottom-32 right-6 md:right-10 p-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-white rounded-full shadow-xl border border-gray-100 dark:border-gray-700 hover:scale-110 transition-all animate-in fade-in zoom-in z-30"
            >
              <ArrowDown size={20} />
            </button>
          )}
        </div>

        {/* Floating Input Bar (Cockpit) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-[#0B0F17] dark:via-[#0B0F17] dark:to-transparent z-30 pointer-events-none">
            <div className="max-w-4xl mx-auto pointer-events-auto">
                <div className="relative group shadow-2xl shadow-blue-900/5 dark:shadow-black/50 rounded-[2rem] bg-white dark:bg-[#151b26] border border-gray-200 dark:border-gray-800 transition-all focus-within:border-blue-400/50 dark:focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/20">
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
                            className={`p-2.5 rounded-full transition-all duration-200 flex items-center justify-center ${!input.trim() ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95'}`}
                          >
                            <Send size={20} className={input.trim() ? "ml-0.5" : ""} />
                          </button>
                        )}
                    </div>
                </div>
                <div className="text-center mt-3">
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-600 tracking-wide uppercase">
                        {isStreaming ? t('app.generating') : appSettings.enterToSend ? t('app.enterToSend') : t('app.ctrlToSend')}
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
            onClearData={handleClearData}
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
        />
      </main>
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
    <I18nextProvider i18n={i18n}>
      <ToastProvider>
        <DialogProvider>
          <NexusChat appSettings={appSettings} setAppSettings={setAppSettings} />
        </DialogProvider>
      </ToastProvider>
    </I18nextProvider>
  );
};

export default App;
