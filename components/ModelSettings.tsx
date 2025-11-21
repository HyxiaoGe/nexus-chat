
import React, { useState } from 'react';
import { AgentConfig, LLMProvider, AppSettings } from '../types';
import { 
    Settings, X, Plus, Save, Trash2, RefreshCw, Loader2, 
    Monitor, Server, Database, Bot, ToggleLeft, ToggleRight, 
    Download, Eraser, Moon, Sun, Edit2, Check
} from 'lucide-react';
import { fetchOpenRouterModels } from '../services/geminiService';

interface ModelSettingsProps {
  agents: AgentConfig[];
  providers: LLMProvider[];
  settings: AppSettings;
  onUpdateAgents: (agents: AgentConfig[]) => void;
  onUpdateProviders: (providers: LLMProvider[]) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onExportData: () => void;
  onClearData: () => void;
  isOpen: boolean;
  onClose: () => void;
}

type Section = 'general' | 'agents' | 'providers' | 'data';

export const ModelSettings: React.FC<ModelSettingsProps> = ({
  agents,
  providers,
  settings,
  onUpdateAgents,
  onUpdateProviders,
  onUpdateSettings,
  onExportData,
  onClearData,
  isOpen,
  onClose
}) => {
  const [activeSection, setActiveSection] = useState<Section>('general');
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [agentForm, setAgentForm] = useState<Partial<AgentConfig>>({});
  
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState<Partial<LLMProvider>>({});
  
  const [isSyncingModels, setIsSyncingModels] = useState(false);

  if (!isOpen) return null;

  // --- Agent Logic ---
  const handleEditAgent = (agent: AgentConfig) => {
    setEditingAgentId(agent.id);
    setAgentForm({ ...agent });
  };

  const handleNewAgent = () => {
    const newId = Math.random().toString(36).substring(2, 15);
    const defaultProvider = providers.find(p => p.enabled) || providers[0];
    const newAgent: AgentConfig = {
        id: newId,
        name: 'New Agent',
        avatar: '🤖',
        providerId: defaultProvider?.id || '',
        modelId: defaultProvider?.suggestedModels[0] || '',
        systemPrompt: 'You are a helpful assistant.',
        enabled: true,
    };
    setAgentForm(newAgent);
    setEditingAgentId(newId);
  };

  const handleSaveAgent = () => {
    if (!editingAgentId || !agentForm.name) return;
    const updatedAgent = agentForm as AgentConfig;
    
    const exists = agents.find(a => a.id === editingAgentId);
    let newAgents;
    if (exists) {
        newAgents = agents.map(a => a.id === editingAgentId ? updatedAgent : a);
    } else {
        newAgents = [...agents, updatedAgent];
    }
    onUpdateAgents(newAgents);
    setEditingAgentId(null);
    setAgentForm({});
  };

  const handleDeleteAgent = (id: string) => {
      if (confirm('Delete this agent?')) {
          onUpdateAgents(agents.filter(a => a.id !== id));
          if (editingAgentId === id) setEditingAgentId(null);
      }
  };

  const handleToggleAgent = (id: string) => {
      onUpdateAgents(agents.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  // --- Provider Logic ---
  const handleExpandProvider = (provider: LLMProvider) => {
      if (expandedProviderId === provider.id) {
          setExpandedProviderId(null);
      } else {
          setExpandedProviderId(provider.id);
          setProviderForm({...provider});
      }
  };

  const handleSaveProvider = () => {
      if (!expandedProviderId) return;
      const updatedProvider = providerForm as LLMProvider;
      onUpdateProviders(providers.map(p => p.id === expandedProviderId ? updatedProvider : p));
      setExpandedProviderId(null);
  };

  const handleSyncModels = async (providerId: string, apiKey: string) => {
      if (!apiKey) {
          alert("Please save your API Key first.");
          return;
      }
      setIsSyncingModels(true);
      try {
          const models = await fetchOpenRouterModels(apiKey);
          if (models.length > 0) {
             const updatedProviders = providers.map(p => 
                 p.id === providerId ? { ...p, fetchedModels: models } : p
             );
             onUpdateProviders(updatedProviders);
             alert(`Successfully synced ${models.length} models from OpenRouter!`);
          } else {
             alert("No models found. Check your API Key.");
          }
      } catch (e) {
          alert("Failed to sync models.");
      } finally {
          setIsSyncingModels(false);
      }
  };

  const handleNewProvider = () => {
      const newId = `custom-${Math.random().toString(36).substring(2, 9)}`;
      const newProvider: LLMProvider = {
          id: newId,
          name: 'Custom Provider',
          type: 'openai-compatible',
          apiKey: '',
          baseURL: 'https://',
          enabled: true,
          isCustom: true,
          suggestedModels: []
      };
      onUpdateProviders([...providers, newProvider]);
      setExpandedProviderId(newId);
      setProviderForm(newProvider);
      setActiveSection('providers');
  };

  const handleDeleteProvider = (id: string) => {
      if(confirm('Delete this provider? associated agents may break.')) {
          onUpdateProviders(providers.filter(p => p.id !== id));
      }
  };

  // --- Renders ---
  const NavItem = ({ section, icon: Icon, label }: { section: Section, icon: any, label: string }) => (
      <button 
        onClick={() => setActiveSection(section)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === section 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
      >
          <Icon size={18} />
          {label}
      </button>
  );

  const renderAgentForm = () => {
      const currentProvider = providers.find(p => p.id === agentForm.providerId);
      const availableModels = currentProvider?.fetchedModels?.length 
          ? currentProvider.fetchedModels 
          : currentProvider?.suggestedModels || [];

      return (
        <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
                <h3 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2"><Edit2 size={16}/> Edit Agent</h3>
                <button onClick={() => setEditingAgentId(null)} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Name</label>
                    <input 
                        type="text" 
                        value={agentForm.name || ''} 
                        onChange={e => setAgentForm({...agentForm, name: e.target.value})}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Agent Name"
                    />
                </div>
                <div className="col-span-1 space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Avatar</label>
                    <input 
                        type="text" 
                        value={agentForm.avatar || ''} 
                        onChange={e => setAgentForm({...agentForm, avatar: e.target.value})}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Emoji"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Provider</label>
                    <select 
                        value={agentForm.providerId || ''}
                        onChange={e => setAgentForm({...agentForm, providerId: e.target.value})}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {providers.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Model ID</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            list="model-suggestions"
                            value={agentForm.modelId || ''} 
                            onChange={e => setAgentForm({...agentForm, modelId: e.target.value})}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Select or type..."
                        />
                        <datalist id="model-suggestions">
                            {availableModels.map(m => (
                                <option key={m} value={m} />
                            ))}
                        </datalist>
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">System Prompt</label>
                <textarea 
                    value={agentForm.systemPrompt || ''} 
                    onChange={e => setAgentForm({...agentForm, systemPrompt: e.target.value})}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none font-mono"
                    placeholder="How should this agent behave?"
                />
            </div>

            <div className="flex gap-3 pt-2">
                <button onClick={handleSaveAgent} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <Save size={16}/> Save Agent
                </button>
                {agents.find(a => a.id === editingAgentId) && (
                    <button onClick={() => handleDeleteAgent(editingAgentId!)} className="px-4 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 border border-transparent dark:border-red-900 rounded-lg transition-colors">
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
      );
  };

  const renderProviderForm = (providerId: string) => {
      const isCustom = providerForm.isCustom;
      const isOpenRouter = providerId === 'provider-openrouter';

      return (
        <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Provider Name</label>
                <input 
                    type="text" 
                    value={providerForm.name || ''}
                    onChange={e => setProviderForm({...providerForm, name: e.target.value})}
                    disabled={!isCustom}
                    className={`w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-white outline-none ${!isCustom ? 'text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                />
            </div>
            
            {providerForm.type === 'openai-compatible' && (isCustom || isOpenRouter) && (
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Base URL {isOpenRouter && '(Default is correct)'}</label>
                    <input 
                        type="text" 
                        value={providerForm.baseURL || ''}
                        onChange={e => setProviderForm({...providerForm, baseURL: e.target.value})}
                        disabled={!isCustom && !isOpenRouter} 
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            )}

            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">API Key {providerForm.type === 'google' && '(Optional if using Env)'}</label>
                <div className="flex gap-2">
                    <input 
                        type="password" 
                        value={providerForm.apiKey || ''}
                        onChange={e => setProviderForm({...providerForm, apiKey: e.target.value})}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="sk-..."
                    />
                    {isOpenRouter && (
                        <button 
                            onClick={() => handleSyncModels(providerId, providerForm.apiKey || '')}
                            disabled={isSyncingModels || !providerForm.apiKey}
                            className="px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg flex items-center gap-2 text-xs font-medium whitespace-nowrap transition-colors"
                            title="Fetch available models from OpenRouter"
                        >
                            {isSyncingModels ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            Sync Models
                        </button>
                    )}
                </div>
                {isOpenRouter && (
                    <p className="text-[10px] text-gray-500 mt-1">Enter key & click Sync to populate model list in Agent settings.</p>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
                {isCustom && (
                     <button onClick={() => handleDeleteProvider(providerId)} className="text-sm text-red-500 hover:text-red-600 mr-auto flex items-center gap-1"><Trash2 size={14} /> Delete Provider</button>
                )}
                <button onClick={() => setExpandedProviderId(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3">Cancel</button>
                <button onClick={handleSaveProvider} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                    <Save size={14} /> Save Configuration
                </button>
            </div>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Main Modal Window */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sidebar Navigation */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col">
            <div className="mb-8 px-2">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Settings className="text-blue-500" />
                    Settings
                </h2>
                <p className="text-xs text-gray-500 mt-1">NexusChat Configuration</p>
            </div>
            
            <nav className="space-y-1 flex-1">
                <NavItem section="general" icon={Monitor} label="General" />
                <NavItem section="agents" icon={Bot} label="My Agents" />
                <NavItem section="providers" icon={Server} label="Providers" />
                <NavItem section="data" icon={Database} label="Data & Storage" />
            </nav>

            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 text-center">
                <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">Close Settings</button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
            <div className="p-8 max-w-3xl mx-auto">
                
                {/* Header for each section */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{activeSection === 'data' ? 'Data Management' : activeSection}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {activeSection === 'general' && 'Customize your interface and preferences.'}
                        {activeSection === 'agents' && 'Manage your AI personas and their behaviors.'}
                        {activeSection === 'providers' && 'Configure API keys and connection endpoints.'}
                        {activeSection === 'data' && 'Export chat history or clear local storage.'}
                    </p>
                </div>

                {/* GENERAL SECTION */}
                {activeSection === 'general' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Appearance</h3>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    {settings.theme === 'dark' ? <Moon className="text-purple-500" /> : <Sun className="text-orange-500" />}
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Theme Mode</p>
                                        <p className="text-xs text-gray-500">Switch between light and dark interfaces.</p>
                                    </div>
                                </div>
                                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                    <button 
                                        onClick={() => onUpdateSettings({...settings, theme: 'light'})}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${settings.theme === 'light' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        Light
                                    </button>
                                    <button 
                                        onClick={() => onUpdateSettings({...settings, theme: 'dark'})}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${settings.theme === 'dark' ? 'bg-gray-600 text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        Dark
                                    </button>
                                </div>
                            </div>
                        </div>

                         <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Input Preferences</h3>
                             <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Enter to Send</p>
                                    <p className="text-xs text-gray-500">If disabled, use Cmd+Enter (Mac) or Ctrl+Enter to send.</p>
                                </div>
                                <button onClick={() => onUpdateSettings({...settings, enterToSend: !settings.enterToSend})} className={`transition-colors ${settings.enterToSend ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {settings.enterToSend ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AGENTS SECTION */}
                {activeSection === 'agents' && (
                    <div className="space-y-4">
                        {editingAgentId && !agents.find(a => a.id === editingAgentId) && renderAgentForm()}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {agents.map(agent => {
                                const provider = providers.find(p => p.id === agent.providerId);
                                const isGoogle = provider?.type === 'google';
                                
                                if (editingAgentId === agent.id) {
                                    return <div key={agent.id} className="md:col-span-2">{renderAgentForm()}</div>
                                }

                                return (
                                    <div key={agent.id} className={`relative group border rounded-xl p-4 transition-all duration-200 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md ${agent.enabled ? 'border-blue-200 dark:border-blue-900' : 'border-gray-200 dark:border-gray-800 opacity-60'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl shadow-inner">
                                                    {agent.avatar}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{agent.name}</h3>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${isGoogle ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900' : 'border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900'}`}>
                                                            {provider?.name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 mt-1 font-mono truncate w-32">{agent.modelId}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => handleToggleAgent(agent.id)} className={`${agent.enabled ? 'text-blue-500' : 'text-gray-400'}`}>
                                                    {agent.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button onClick={() => handleEditAgent(agent)} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm">
                                                <Edit2 size={14} />
                                             </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {!editingAgentId && (
                            <button onClick={handleNewAgent} className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 text-gray-500 dark:text-gray-400 hover:text-blue-500 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all bg-gray-50 dark:bg-gray-800/30">
                                <Plus size={18} /> Create New Agent
                            </button>
                        )}
                    </div>
                )}

                {/* PROVIDERS SECTION */}
                {activeSection === 'providers' && (
                     <div className="space-y-6">
                         <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg flex gap-3">
                            <div className="text-blue-500 mt-0.5"><Server size={18} /></div>
                            <div className="text-sm text-blue-900 dark:text-blue-100">
                                <p className="font-semibold mb-1">Why configure providers?</p>
                                <p className="opacity-80">Providers are the actual AI services. Configure them once (API Key, URL) and link multiple agents to them.</p>
                            </div>
                         </div>

                        <div className="space-y-4">
                            {providers.map(provider => (
                                <div key={provider.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-900 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm ${provider.type === 'google' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'}`}>
                                                {provider.type === 'google' ? 'G' : <Server size={20} />}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    {provider.name}
                                                    {provider.apiKey && <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Check size={8} /> Connected</span>}
                                                </h3>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {provider.type === 'google' ? 'Google Native API' : 'OpenAI Compatible Endpoint'}
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleExpandProvider(provider)} 
                                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors border ${expandedProviderId === provider.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            {expandedProviderId === provider.id ? 'Close Config' : 'Configure'}
                                        </button>
                                    </div>
                                    {expandedProviderId === provider.id && renderProviderForm(provider.id)}
                                </div>
                            ))}
                        </div>

                        <button onClick={handleNewProvider} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500/50 text-gray-500 hover:text-blue-500 rounded-lg flex items-center justify-center gap-2 text-sm transition-all">
                             <Plus size={16} /> Add Custom Provider
                        </button>
                     </div>
                )}

                {/* DATA SECTION */}
                {activeSection === 'data' && (
                    <div className="space-y-6">
                         <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <Download size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Export Data</h3>
                                    <p className="text-sm text-gray-500 mt-1 mb-4">Download all your sessions, messages, and configuration as a JSON file.</p>
                                    <button onClick={onExportData} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors">
                                        Download JSON Backup
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                                    <Eraser size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-red-800 dark:text-red-100">Danger Zone</h3>
                                    <p className="text-sm text-red-600 dark:text-red-300/70 mt-1 mb-4">Permanently delete all chat history and custom configurations. This cannot be undone.</p>
                                    <button onClick={onClearData} className="px-4 py-2 bg-white hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium transition-colors">
                                        Clear All Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>

      </div>
    </div>
  );
};