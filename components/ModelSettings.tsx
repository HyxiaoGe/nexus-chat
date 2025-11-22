import React, { useState, useEffect } from 'react';
import { AgentConfig, LLMProvider, AppSettings } from '../types';
import { 
    Settings, X, Plus, Save, Trash2, RefreshCw, Loader2, 
    Monitor, Server, Database, Bot, ToggleLeft, ToggleRight, 
    Download, Eraser, Moon, Sun, Edit2, Check, ShieldCheck,
    Eye, EyeOff, Globe, Info
} from 'lucide-react';
import { fetchProviderModels, validateOpenRouterKey } from '../services/geminiService';
import { useToast } from './Toast';
import { useConfirm } from '../contexts/DialogContext';
import { useTranslation } from 'react-i18next';
import { SYSTEM_PROMPT_TEMPLATES, PROVIDER_PRESETS, BRAND_CONFIGS, getBrandFromModelId } from '../constants';

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
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [activeSection, setActiveSection] = useState<Section>('general');
  
  // Agent Editing State
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [agentForm, setAgentForm] = useState<Partial<AgentConfig>>({});
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string | null>(null);
  
  // Provider Editing State
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState<Partial<LLMProvider>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [isSyncingModels, setIsSyncingModels] = useState(false);
  const [fetchingModelsForAgent, setFetchingModelsForAgent] = useState(false);
  const [manualModelEntry, setManualModelEntry] = useState(false); 
  const { success, error, info } = useToast();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
        setEditingAgentId(null);
        setExpandedProviderId(null);
    }
  }, [isOpen]);

  // --- Agent Logic ---
  
  // AUTO-FETCH MODELS: When selecting a provider in Agent Edit mode, try to fetch models automatically
  useEffect(() => {
    if (editingAgentId && agentForm.providerId) {
        const provider = providers.find(p => p.id === agentForm.providerId);
        
        // Auto-fetch if not fetched yet, provider enabled, not Google (static), and not manual mode
        if (provider && !provider.fetchedModels && provider.type !== 'google' && provider.baseURL && !manualModelEntry) {
            handleRefreshModelsForAgent(provider.id, true);
        }
    }
  }, [agentForm.providerId, editingAgentId]);

  // When opening an agent, try to detect the brand from the current modelId to set initial filter
  useEffect(() => {
      if (editingAgentId && agentForm.modelId) {
          const brandKey = getBrandFromModelId(agentForm.modelId);
          setSelectedBrandFilter(brandKey);
      }
  }, [editingAgentId]);

  const handleEditAgent = (agent: AgentConfig) => {
    setEditingAgentId(agent.id);
    setAgentForm({ ...agent });
    setManualModelEntry(false);
  };

  const handleNewAgent = () => {
    const newId = Math.random().toString(36).substring(2, 15);
    const defaultProvider = providers.find(p => p.enabled) || providers[0];
    const defaultModel = defaultProvider?.suggestedModels?.[0] || '';
    
    // Auto derive info
    const brand = getBrandFromModelId(defaultModel);
    const autoName = defaultModel ? (defaultModel.split('/').pop() || defaultModel) : 'New Agent';

    const newAgent: AgentConfig = {
        id: newId,
        name: autoName,
        avatar: BRAND_CONFIGS[brand]?.logo || BRAND_CONFIGS.other.logo,
        providerId: defaultProvider?.id || '',
        modelId: defaultModel,
        systemPrompt: 'You are a helpful assistant.',
        enabled: true,
    };
    setAgentForm(newAgent);
    setEditingAgentId(newId);
    setManualModelEntry(false);
    setSelectedBrandFilter(brand);
  };

  const handleSaveAgent = () => {
    if (!editingAgentId || !agentForm.modelId) {
        error(t('settings.agents.agentNameRequired')); // Reusing error message key for Model ID check implicitly
        return;
    }
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
    success(t('settings.agents.agentSaved'));
  };

  const handleDeleteAgent = async (id: string) => {
      const isConfirmed = await confirm({
        title: t('common.delete'),
        description: t('settings.agents.deleteConfirm'),
        variant: 'danger',
        confirmLabel: t('common.delete')
      });

      if (isConfirmed) {
          onUpdateAgents(agents.filter(a => a.id !== id));
          if (editingAgentId === id) setEditingAgentId(null);
          info(t('settings.agents.agentDeleted'));
      }
  };

  const handleToggleAgent = (id: string) => {
      onUpdateAgents(agents.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const applyAgentTemplate = (template: typeof SYSTEM_PROMPT_TEMPLATES[0]) => {
      setAgentForm(prev => ({
          ...prev,
          systemPrompt: template.prompt
      }));
  };

  const handleRefreshModelsForAgent = async (providerId: string, silent = false) => {
      const provider = providers.find(p => p.id === providerId);
      if (!provider) return;
      
      setFetchingModelsForAgent(true);
      try {
          const models = await fetchProviderModels(provider);
          if (models.length > 0) {
              const updatedProvider = { ...provider, fetchedModels: models };
              onUpdateProviders(providers.map(p => p.id === providerId ? updatedProvider : p));
              if (!silent) success(t('settings.providers.syncSuccess'));
          } else {
              if (!silent) info(t('settings.providers.noModels'));
          }
      } catch (e: any) {
          if (!silent) error(`${t('common.error')}: ${e.message}`);
      } finally {
          setFetchingModelsForAgent(false);
      }
  };

  // --- Provider Logic ---
  const handleExpandProvider = (provider: LLMProvider) => {
      if (expandedProviderId === provider.id) {
          setExpandedProviderId(null);
      } else {
          setExpandedProviderId(provider.id);
          setProviderForm({...provider});
          setShowApiKey(false); 
      }
  };

  const handleSaveProvider = async () => {
      if (!expandedProviderId) return;
      const updatedProvider = providerForm as LLMProvider;
      onUpdateProviders(providers.map(p => p.id === expandedProviderId ? updatedProvider : p));
      setExpandedProviderId(null);
      success(t('settings.providers.saved'));
  };

  const handleSyncModels = async (providerId: string, providerConfig: LLMProvider) => {
      setIsSyncingModels(true);
      try {
          const models = await fetchProviderModels(providerConfig);
          if (models.length > 0) {
             const updatedProviders = providers.map(p => 
                 p.id === providerId ? { ...p, fetchedModels: models } : p
             );
             onUpdateProviders(updatedProviders);
             success(t('settings.providers.syncSuccess'));
          } else {
             error(t('settings.providers.noModels'));
          }
      } catch (e: any) {
          error(`${t('common.error')}: ${e.message}`);
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
          baseURL: 'http://localhost:11434/v1',
          enabled: true,
          isCustom: true,
          suggestedModels: []
      };
      onUpdateProviders([...providers, newProvider]);
      setExpandedProviderId(newId);
      setProviderForm(newProvider);
      setShowApiKey(false);
      setActiveSection('providers');
  };

  const handleDeleteProvider = async (id: string) => {
      const isConfirmed = await confirm({
        title: t('settings.providers.delete'),
        description: t('settings.providers.confirmDelete'),
        variant: 'danger',
        confirmLabel: t('common.delete')
      });

      if(isConfirmed) {
          onUpdateProviders(providers.filter(p => p.id !== id));
          info(t('settings.providers.delete'));
      }
  };

  const applyProviderPreset = (preset: typeof PROVIDER_PRESETS[0]) => {
      setProviderForm(prev => ({
          ...prev,
          name: preset.name,
          baseURL: preset.baseUrl
      }));
  };
  
  const handleClearAllData = async () => {
      const isConfirmed = await confirm({
          title: t('settings.data.clear'),
          description: t('settings.data.confirmClear'),
          variant: 'danger',
          confirmLabel: t('settings.data.clear')
      });
      if (isConfirmed) onClearData();
  }

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
      const isGoogle = currentProvider?.type === 'google';
      const hasFetchedModels = !!(currentProvider?.fetchedModels && currentProvider.fetchedModels.length > 0);
      
      const allModels: string[] = (hasFetchedModels 
          ? currentProvider?.fetchedModels 
          : currentProvider?.suggestedModels) || [];

      const brands = new Set<string>();
      if (isGoogle) {
          brands.add('google');
      } else {
          allModels.forEach(m => {
              brands.add(getBrandFromModelId(m));
          });
      }
      const availableBrands = Array.from(brands).sort();

      let filteredModels = allModels;
      if (!isGoogle && selectedBrandFilter) {
          filteredModels = allModels.filter(m => getBrandFromModelId(m) === selectedBrandFilter);
      }

      const useManualInput = manualModelEntry || (!hasFetchedModels && allModels.length === 0);
      const canFetchModels = !isGoogle && currentProvider?.baseURL;

      // Preview what the agent will look like
      const previewBrand = getBrandFromModelId(agentForm.modelId || '');
      const previewLogo = BRAND_CONFIGS[previewBrand]?.logo || BRAND_CONFIGS.other.logo;
      const previewName = agentForm.modelId ? (agentForm.modelId.split('/').pop() || agentForm.modelId) : 'New Agent';

      return (
        <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
                <h3 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2"><Edit2 size={16}/> {t('settings.agents.edit')}</h3>
                <button onClick={() => setEditingAgentId(null)} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
            </div>

            {/* LIVE PREVIEW CARD */}
            <div className="bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-4 shadow-sm">
                 <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                     <img src={previewLogo} alt="logo" className="w-10 h-10 object-contain" />
                 </div>
                 <div>
                     <div className="text-xs text-gray-500 uppercase font-bold mb-0.5">Agent Preview</div>
                     <div className="font-bold text-gray-900 dark:text-white">{previewName}</div>
                 </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                 {/* 1. Provider Selection */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">1. {t('settings.agents.provider')}</label>
                        <select 
                            value={agentForm.providerId || ''}
                            onChange={e => {
                                const newProvider = providers.find(p => p.id === e.target.value);
                                const isNewGoogle = newProvider?.type === 'google';
                                setAgentForm({
                                    ...agentForm, 
                                    providerId: e.target.value, 
                                    modelId: '' 
                                });
                                setManualModelEntry(false);
                                if (isNewGoogle) setSelectedBrandFilter('google');
                                else setSelectedBrandFilter(null);
                            }} 
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {providers.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Brand/Vendor Filter */}
                    {!isGoogle && !useManualInput && (
                         <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500 uppercase">2. Filter by Brand</label>
                             <select 
                                value={selectedBrandFilter || ''}
                                onChange={e => {
                                    setSelectedBrandFilter(e.target.value);
                                    setAgentForm({ ...agentForm, modelId: '' });
                                }}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                disabled={availableBrands.length === 0}
                             >
                                 <option value="" disabled>All Brands</option>
                                 {availableBrands.map(b => (
                                     <option key={b} value={b}>{BRAND_CONFIGS[b]?.name || b}</option>
                                 ))}
                             </select>
                         </div>
                    )}
                 </div>
                
                {/* 3. Model Selection */}
                <div className="space-y-1 mt-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                             {isGoogle ? '2. ' : '3. '} {t('settings.agents.modelId')}
                        </label>
                        <div className="flex items-center gap-2">
                            {!useManualInput && canFetchModels && (
                                <button onClick={() => setManualModelEntry(true)} className="text-[10px] text-gray-400 hover:text-blue-500 underline">
                                    Type manually
                                </button>
                            )}
                            {useManualInput && (allModels.length > 0) && (
                                <button onClick={() => setManualModelEntry(false)} className="text-[10px] text-gray-400 hover:text-blue-500 underline">
                                    Select from list
                                </button>
                            )}
                            {canFetchModels && (
                                <button 
                                    onClick={() => agentForm.providerId && handleRefreshModelsForAgent(agentForm.providerId)}
                                    disabled={fetchingModelsForAgent}
                                    className="text-[10px] flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {fetchingModelsForAgent ? <Loader2 size={10} className="animate-spin"/> : <RefreshCw size={10} />}
                                    {hasFetchedModels ? 'Refresh List' : 'Load Models'}
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="relative">
                         {!useManualInput ? (
                             <select
                                value={agentForm.modelId || ''} 
                                onChange={e => {
                                    const newModel = e.target.value;
                                    const brand = getBrandFromModelId(newModel);
                                    const autoName = newModel.split('/').pop() || newModel;

                                    setAgentForm({
                                        ...agentForm, 
                                        modelId: newModel,
                                        name: autoName,
                                        avatar: BRAND_CONFIGS[brand]?.logo || BRAND_CONFIGS.other.logo
                                    });
                                }}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                disabled={filteredModels.length === 0}
                             >
                                 <option value="" disabled>Select a model...</option>
                                 {filteredModels.map(m => (
                                     <option key={m} value={m}>{m}</option>
                                 ))}
                             </select>
                         ) : (
                            <input 
                                type="text" 
                                value={agentForm.modelId || ''} 
                                onChange={e => {
                                    const val = e.target.value;
                                    const brand = getBrandFromModelId(val);
                                    const autoName = val.split('/').pop() || val;
                                    setAgentForm({
                                        ...agentForm, 
                                        modelId: val,
                                        name: autoName,
                                        avatar: BRAND_CONFIGS[brand]?.logo || BRAND_CONFIGS.other.logo
                                    })
                                }}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g., deepseek/deepseek-chat"
                            />
                         )}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500 uppercase">{t('settings.agents.systemPrompt')}</label>
                    <div className="flex gap-1">
                        {SYSTEM_PROMPT_TEMPLATES.map(tpl => (
                            <button
                                key={tpl.label}
                                onClick={() => applyAgentTemplate(tpl)}
                                className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-300 hover:text-blue-600 rounded transition-colors"
                                title={tpl.label}
                            >
                                {tpl.icon}
                            </button>
                        ))}
                    </div>
                </div>
                <textarea 
                    value={agentForm.systemPrompt || ''} 
                    onChange={e => setAgentForm({...agentForm, systemPrompt: e.target.value})}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none font-mono leading-relaxed"
                    placeholder={t('settings.agents.placeholderPrompt')}
                />
            </div>

            <div className="flex gap-3 pt-2">
                <button onClick={handleSaveAgent} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <Save size={16}/> {t('settings.agents.save')}
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
      const canSyncModels = !!providerForm.baseURL;

      return (
        <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4 animate-in fade-in slide-in-from-top-2">
            {isCustom && (
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                    {PROVIDER_PRESETS.map(preset => (
                         <button
                            key={preset.name}
                            onClick={() => applyProviderPreset(preset)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-sm min-w-fit"
                        >
                            <span>{preset.icon}</span>
                            {preset.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">{t('settings.providers.name')}</label>
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
                    <label className="text-xs font-medium text-gray-500 uppercase">{t('settings.providers.baseUrl')} {isOpenRouter && t('settings.providers.defaultCorrect')}</label>
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
                <label className="text-xs font-medium text-gray-500 uppercase">{t('settings.providers.apiKey')} {providerForm.type === 'google' && t('settings.providers.apiKeyOptional')}</label>
                <div className="flex gap-2">
                    <div className="relative w-full">
                        <input 
                            type={showApiKey ? "text" : "password"}
                            value={providerForm.apiKey || ''}
                            onChange={e => setProviderForm({...providerForm, apiKey: e.target.value})}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 pr-10 text-sm text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="sk-..."
                        />
                        <button 
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            tabIndex={-1}
                        >
                            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    
                    {canSyncModels && (
                        <button 
                            onClick={() => handleSyncModels(providerId, providerForm as LLMProvider)}
                            disabled={isSyncingModels}
                            className="px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg flex items-center gap-2 text-xs font-medium whitespace-nowrap transition-colors"
                            title={t('settings.providers.verifySync')}
                        >
                            {isSyncingModels ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            {t('settings.providers.verifySync')}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                {isCustom && (
                     <button onClick={() => handleDeleteProvider(providerId)} className="text-sm text-red-500 hover:text-red-600 mr-auto flex items-center gap-1"><Trash2 size={14} /> {t('settings.providers.delete')}</button>
                )}
                <button onClick={() => setExpandedProviderId(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3">{t('settings.providers.cancel')}</button>
                <button onClick={handleSaveProvider} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                    <Save size={14} /> {t('settings.providers.saveVerify')}
                </button>
            </div>
        </div>
      );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sidebar Navigation */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col">
            <div className="mb-8 px-2">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Settings className="text-blue-500" />
                    {t('settings.title')}
                </h2>
                <p className="text-xs text-gray-500 mt-1">{t('settings.subtitle')}</p>
            </div>
            <nav className="space-y-1 flex-1">
                <NavItem section="general" icon={Monitor} label={t('settings.nav.general')} />
                <NavItem section="agents" icon={Bot} label={t('settings.nav.agents')} />
                <NavItem section="providers" icon={Server} label={t('settings.nav.providers')} />
                <NavItem section="data" icon={Database} label={t('settings.nav.data')} />
            </nav>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 text-center">
                <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">{t('common.close')}</button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
            <div className="p-8 max-w-3xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                        {activeSection === 'general' && t('settings.general.title')}
                        {activeSection === 'agents' && t('settings.agents.title')}
                        {activeSection === 'providers' && t('settings.providers.title')}
                        {activeSection === 'data' && t('settings.data.title')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {activeSection === 'general' && t('settings.general.desc')}
                        {activeSection === 'agents' && t('settings.agents.desc')}
                        {activeSection === 'providers' && t('settings.providers.desc')}
                        {activeSection === 'data' && t('settings.data.desc')}
                    </p>
                </div>

                {activeSection === 'general' && (
                    <div className="space-y-6">
                        {/* Theme Settings */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">{t('settings.general.appearance')}</h3>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    {settings.theme === 'dark' ? <Moon className="text-purple-500" /> : <Sun className="text-orange-500" />}
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.general.theme')}</p>
                                        <p className="text-xs text-gray-500">{t('settings.general.themeDesc')}</p>
                                    </div>
                                </div>
                                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                    <button 
                                        onClick={() => { onUpdateSettings({...settings, theme: 'light'}); success(t('settings.general.themeChanged', { theme: t('settings.general.light') })); }}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${settings.theme === 'light' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        {t('settings.general.light')}
                                    </button>
                                    <button 
                                        onClick={() => { onUpdateSettings({...settings, theme: 'dark'}); success(t('settings.general.themeChanged', { theme: t('settings.general.dark') })); }}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${settings.theme === 'dark' ? 'bg-gray-600 text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        {t('settings.general.dark')}
                                    </button>
                                </div>
                            </div>
                             <div className="flex items-center justify-between p-4 mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Globe className="text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.general.language')}</p>
                                        <p className="text-xs text-gray-500">{t('settings.general.languageDesc')}</p>
                                    </div>
                                </div>
                                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                    <button 
                                        onClick={() => onUpdateSettings({...settings, language: 'en'})}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${settings.language === 'en' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        English
                                    </button>
                                    <button 
                                        onClick={() => onUpdateSettings({...settings, language: 'zh'})}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${settings.language === 'zh' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        中文
                                    </button>
                                </div>
                            </div>
                        </div>
                         <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">{t('settings.general.input')}</h3>
                             <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t('settings.general.enterToSend')}</p>
                                    <p className="text-xs text-gray-500">{t('settings.general.enterToSendDesc')}</p>
                                </div>
                                <button onClick={() => onUpdateSettings({...settings, enterToSend: !settings.enterToSend})} className={`transition-colors ${settings.enterToSend ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {settings.enterToSend ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                                                    {agent.avatar?.startsWith('http') ? <img src={agent.avatar} className="w-9 h-9 object-contain" alt="avatar"/> : agent.avatar}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{agent.name}</h3>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${isGoogle ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900' : 'border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900'}`}>
                                                            {provider?.name || t('common.unknown')}
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
                                <Plus size={18} /> {t('settings.agents.new')}
                            </button>
                        )}
                    </div>
                )}

                {activeSection === 'providers' && (
                     <div className="space-y-6">
                         <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg flex gap-3">
                            <div className="text-blue-500 mt-0.5"><Server size={18} /></div>
                            <div className="text-sm text-blue-900 dark:text-blue-100">
                                <p className="font-semibold mb-1">{t('settings.providers.infoTitle')}</p>
                                <p className="opacity-80">{t('settings.providers.infoDesc')}</p>
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
                                                    {provider.apiKey && <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Check size={8} /> {t('settings.providers.connected')}</span>}
                                                </h3>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {provider.type === 'google' ? t('settings.providers.googleApi') : t('settings.providers.openaiApi')}
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleExpandProvider(provider)} 
                                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors border ${expandedProviderId === provider.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            {expandedProviderId === provider.id ? t('common.close') : t('common.edit')}
                                        </button>
                                    </div>
                                    {expandedProviderId === provider.id && renderProviderForm(provider.id)}
                                </div>
                            ))}
                        </div>
                        <button onClick={handleNewProvider} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500/50 text-gray-500 hover:text-blue-500 rounded-lg flex items-center justify-center gap-2 text-sm transition-all">
                             <Plus size={16} /> {t('settings.providers.addCustom')}
                        </button>
                     </div>
                )}

                {activeSection === 'data' && (
                    <div className="space-y-6">
                         <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <Download size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('settings.data.export')}</h3>
                                    <p className="text-sm text-gray-500 mt-1 mb-4">{t('settings.data.exportDesc')}</p>
                                    <button onClick={onExportData} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors">
                                        {t('settings.data.download')}
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
                                    <h3 className="text-base font-bold text-red-800 dark:text-red-100">{t('settings.data.danger')}</h3>
                                    <p className="text-sm text-red-600 dark:text-red-300/70 mt-1 mb-4">{t('settings.data.dangerDesc')}</p>
                                    <button onClick={handleClearAllData} className="px-4 py-2 bg-white hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium transition-colors">
                                        {t('settings.data.clear')}
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