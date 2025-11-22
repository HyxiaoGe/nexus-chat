
import React, { useState, useEffect, useRef } from 'react';
import { Menu, Send, Settings as SettingsIcon, Plus, MessageSquare } from 'lucide-react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from './i18n';

import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { ModelSettings } from './components/ModelSettings';
import { ToastProvider } from './components/Toast';
import { generateContentStream } from './services/geminiService';
import { DEFAULT_AGENTS, DEFAULT_PROVIDERS, STORAGE_KEYS, DEFAULT_APP_SETTINGS } from './constants';
import { Message, Session, AgentConfig, LLMProvider, AppSettings } from './types';

const generateId = () => Math.random().toString(36).substring(2, 15);

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
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // --- Scroll to bottom ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // --- Actions ---
  const createNewSession = () => {
    // Note: t() might not be ready on first render if using backend, but with resource bundle it is fine.
    // We can default to "New Chat" if t is missing or use a key that is replaced later? 
    // Actually, title is persisted, so we must generate a string.
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

  const handleSendMessage = async () => {
    if (!input.trim() || !activeSessionId || isStreaming) return;

    const currentInput = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // 1. User Message
    const userMsg: Message = {
      id: generateId(),
      sessionId: activeSessionId,
      role: 'user',
      content: currentInput,
      timestamp: Date.now(),
    };

    // 2. Identify Active Agents
    const activeAgents = agents.filter(a => a.enabled);
    if (activeAgents.length === 0) {
        const errorMsg: Message = {
            id: generateId(),
            sessionId: activeSessionId,
            role: 'model',
            content: t('app.noAgentsEnabled'),
            timestamp: Date.now()
        };
        const updated = [...messages, userMsg, errorMsg];
        setMessages(updated);
        saveMessagesToStorage(activeSessionId, updated);
        return;
    }

    // 3. Create Placeholder Messages
    const agentMessages: Message[] = activeAgents.map(agent => ({
      id: generateId(),
      sessionId: activeSessionId,
      role: 'model',
      content: '',
      agentId: agent.id,
      timestamp: Date.now(),
      isStreaming: true,
    }));

    const newMessagesState = [...messages, userMsg, ...agentMessages];
    setMessages(newMessagesState);
    saveMessagesToStorage(activeSessionId, newMessagesState);
    setIsStreaming(true);

    // 4. Parallel Requests
    try {
      await Promise.all(activeAgents.map(async (agent, index) => {
        const messageId = agentMessages[index].id;
        const provider = providers.find(p => p.id === agent.providerId);

        if (!provider) {
             setMessages(prev => {
                 const final = prev.map(m => m.id === messageId ? { ...m, isStreaming: false, error: t('app.configError') } : m);
                 saveMessagesToStorage(activeSessionId, final);
                 return final;
             });
             return;
        }

        try {
          await generateContentStream({
            agent: agent,
            provider: provider,
            prompt: currentInput,
            onChunk: (text) => {
              setMessages(prev => prev.map(m => 
                  m.id === messageId ? { ...m, content: m.content + text } : m
              ));
            }
          });

          setMessages(prev => {
              const final = prev.map(m => m.id === messageId ? { ...m, isStreaming: false } : m);
              saveMessagesToStorage(activeSessionId, final);
              return final;
          });

        } catch (err: any) {
          console.error(err);
          setMessages(prev => {
            const final = prev.map(m => m.id === messageId ? { ...m, isStreaming: false, error: err.message || t('common.failed') } : m);
            saveMessagesToStorage(activeSessionId, final);
            return final;
          });
        }
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (appSettings.enterToSend) {
          e.preventDefault();
          handleSendMessage();
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
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      
      <Sidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
        onCreateSession={createNewSession}
        onDeleteSession={deleteSession}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 flex flex-col h-full relative min-w-0 transition-all duration-300">
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/90 backdrop-blur flex items-center justify-between px-4 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <Menu size={24} />
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
          
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:shadow-sm">
            <SettingsIcon size={16} className="text-blue-500 dark:text-blue-400" />
            <span className="hidden sm:inline">{t('app.settings')}</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 scroll-smooth bg-white dark:bg-gray-950">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-600 space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center shadow-lg border border-gray-200 dark:border-gray-700">
                    <Plus size={40} className="text-blue-500 opacity-80" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">{t('app.welcomeTitle')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                       {t('app.welcomeSubtitle')}
                    </p>
                    <div className="flex justify-center gap-2 mt-4">
                        <button onClick={() => setIsSettingsOpen(true)} className="text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/10 dark:hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/30 transition-colors">
                            {t('app.configureAgents')}
                        </button>
                        <button className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 transition-colors cursor-default">
                            {t('app.agentsReady')}
                        </button>
                    </div>
                </div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                config={agents.find(a => a.id === msg.agentId)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-950/95 backdrop-blur">
            <div className="max-w-4xl mx-auto relative group">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={t('app.inputPlaceholder')}
                    disabled={isStreaming}
                    rows={1}
                    className="w-full bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white rounded-2xl pl-4 pr-12 py-3.5 border border-gray-200 dark:border-gray-800 focus:border-blue-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/30 scrollbar-hide shadow-sm transition-all"
                    style={{ minHeight: '52px' }}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isStreaming}
                    className={`absolute right-2 bottom-2.5 p-2 rounded-xl transition-all duration-200 ${!input.trim() || isStreaming ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-50 shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95'}`}
                >
                    {isStreaming ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                </button>
            </div>
            <div className="text-center mt-2">
                <span className="text-[10px] text-gray-400 dark:text-gray-600">
                    {isStreaming ? t('app.generating') : appSettings.enterToSend ? t('app.enterToSend') : t('app.ctrlToSend')}
                </span>
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
        <NexusChat appSettings={appSettings} setAppSettings={setAppSettings} />
      </ToastProvider>
    </I18nextProvider>
  );
};

export default App;
