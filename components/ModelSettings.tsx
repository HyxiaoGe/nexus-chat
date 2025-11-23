
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AgentConfig, LLMProvider, AppSettings } from '../types';
import { 
    Settings, X, Plus, Save, Trash2, RefreshCw, Loader2, 
    Monitor, Server, Database, Bot, ToggleLeft, ToggleRight, 
    Download, Eraser, Moon, Sun, Edit2, Check, ShieldCheck,
    Eye, EyeOff, Globe, Info, ChevronDown, Search, Wrench, Sliders,
    BrainCircuit
} from 'lucide-react';
import { fetchProviderModels } from '../services/geminiService';
import { useToast } from './Toast';
import { useConfirm } from '../contexts/DialogContext';
import { useTranslation } from 'react-i18next';
import { SYSTEM_PROMPT_TEMPLATES, PROVIDER_PRESETS, BRAND_CONFIGS, getBrandFromModelId, isThinkingModel, isNewModel } from '../constants';
import { BrandIcon } from './BrandIcons';
import { Sparkles } from 'lucide-react';

interface ModelSettingsProps {
  agents: AgentConfig[];
  providers: LLMProvider[];
  settings: AppSettings;
  onUpdateAgents: (agents: AgentConfig[]) => void;
  onUpdateProviders: (providers: LLMProvider[]) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearData: () => void;
  isOpen: boolean;
  onClose: () => void;
}

type Section = 'general' | 'agents' | 'providers' | 'data';

// --- Custom Dropdown Component ---
interface IconOption {
    value: string;
    label: string;
    subLabel?: string;
    icon?: string | React.ReactNode;
    badges?: { label: string; icon?: React.ReactNode; colorClass: string }[];
}

const IconSelect = ({ 
    value, 
    onChange, 
    options, 
    placeholder, 
    disabled = false 
}: { 
    value: string; 
    onChange: (val: string) => void; 
    options: IconOption[]; 
    placeholder?: string;
    disabled?: boolean;
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset search when closed
    useEffect(() => { if (!isOpen) setSearch(''); }, [isOpen]);

    const selectedOption = options.find(o => o.value === value);
    const filteredOptions = options.filter(o => 
        o.label.toLowerCase().includes(search.toLowerCase()) || 
        (o.subLabel && o.subLabel.toLowerCase().includes(search.toLowerCase()))
    );

    const renderIcon = (icon: string | React.ReactNode) => {
        if (!icon) return <Bot size={16} className="text-gray-400"/>;
        // If it's a string key like 'deepseek'
        if (typeof icon === 'string' && !icon.startsWith('http') && !icon.startsWith('<')) {
            return <BrandIcon brand={icon} size={20} />;
        }
        // If it's a URL
        if (typeof icon === 'string') return <img src={icon} alt="" className="w-5 h-5 object-contain" />;
        // React Node
        return icon;
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between bg-white dark:bg-gray-800
                    border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3
                    text-sm text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    outline-none transition-all duration-200
                    shadow-sm hover:shadow-md
                    ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-300 dark:hover:border-blue-600'}
                    ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                `}
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {selectedOption ? (
                        <>
                            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                {renderIcon(selectedOption.icon)}
                            </div>
                            <div className="flex items-center gap-2 truncate flex-wrap">
                                <span className="truncate font-medium">{selectedOption.label}</span>
                                {selectedOption.badges?.map((badge, idx) => (
                                    <span key={idx} className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${badge.colorClass}`}>
                                        {badge.icon}
                                        {badge.label}
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <span className="text-gray-400 font-medium">{placeholder || t('settings.editor.select')}</span>
                    )}
                </div>
                <ChevronDown size={18} className={`text-gray-400 transition-all duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''} ml-2 flex-shrink-0`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-80 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                    {options.length > 10 && (
                        <div className="p-3 border-b-2 border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/50 transition-all"
                                    placeholder={t('settings.editor.search')}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    <div className="overflow-y-auto custom-scrollbar flex-1">
                        {filteredOptions.length === 0 ? (
                             <div className="p-4 text-sm text-gray-500 text-center font-medium">{t('settings.editor.noOptions')}</div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 text-sm text-left
                                        transition-all duration-150 border-b border-gray-100 dark:border-gray-800 last:border-b-0
                                        ${value === opt.value
                                            ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-300'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-700/30 dark:hover:to-gray-800/20'}
                                    `}
                                >
                                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                        {renderIcon(opt.icon)}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="truncate font-semibold">{opt.label}</span>
                                            {opt.badges?.map((badge, idx) => (
                                                <span key={idx} className={`flex-shrink-0 flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${badge.colorClass}`}>
                                                    {badge.icon}
                                                    {badge.label}
                                                </span>
                                            ))}
                                        </div>
                                        {opt.subLabel && <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{opt.subLabel}</span>}
                                    </div>
                                    {value === opt.value && <Check size={16} className="ml-auto text-blue-600 dark:text-blue-400 flex-shrink-0" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const ModelSettings: React.FC<ModelSettingsProps> = ({
  agents,
  providers,
  settings,
  onUpdateAgents,
  onUpdateProviders,
  onUpdateSettings,
  onExportData,
  onImportData,
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
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  
  // Provider Editing State
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState<Partial<LLMProvider>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [isSyncingModels, setIsSyncingModels] = useState(false);
  const [manualModelEntry, setManualModelEntry] = useState(false); 
  const { success, error, info } = useToast();

  // --- Aggregated Models Logic ---
  // Combine models from ALL providers into a single searchable list
  const allAggregatedModels = useMemo(() => {
      const list: { modelId: string; providerId: string; providerName: string; brand: string }[] = [];
      
      providers.forEach(p => {
          if (!p.enabled) return;
          
          // Use fetched models if available, otherwise defaults
          const sourceModels = (p.fetchedModels && p.fetchedModels.length > 0) 
              ? p.fetchedModels 
              : p.suggestedModels;
              
          sourceModels.forEach(m => {
              list.push({
                  modelId: m,
                  providerId: p.id,
                  providerName: p.name,
                  brand: getBrandFromModelId(m)
              });
          });
      });
      return list;
  }, [providers]);

  // Extract unique brands from the aggregated list
  const availableBrands = useMemo(() => {
      const brands = new Set<string>(allAggregatedModels.map(m => m.brand));
      // Always ensure Google/OpenAI/Anthropic are present if they exist in config, even if no models fetched yet
      return Array.from(brands).sort();
  }, [allAggregatedModels]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
        setEditingAgentId(null);
        setExpandedProviderId(null);
    }
  }, [isOpen]);

  // --- Agent Logic ---
  
  const handleEditAgent = (agent: AgentConfig) => {
    setEditingAgentId(agent.id);
    setAgentForm({ ...agent });
    
    // Attempt to match existing model to brand
    const brand = getBrandFromModelId(agent.modelId);
    setSelectedBrand(brand);
    setManualModelEntry(false);
  };

  const handleNewAgent = () => {
    const newId = Math.random().toString(36).substring(2, 15);
    
    // Default to Google Flash if available, else first available
    const defaultModelEntry = allAggregatedModels.find(m => m.modelId.includes('gemini-2.5-flash')) || allAggregatedModels[0];
    
    const newAgent: AgentConfig = {
        id: newId,
        name: 'New Agent',
        avatar: BRAND_CONFIGS.other.logo,
        providerId: '', // Will be set below
        modelId: '',
        systemPrompt: 'You are a helpful assistant.',
        enabled: true,
        config: { temperature: 0.7 }
    };

    if (defaultModelEntry) {
        newAgent.providerId = defaultModelEntry.providerId;
        newAgent.modelId = defaultModelEntry.modelId;
        newAgent.name = 'Gemini Flash';
        newAgent.avatar = 'google';
        setSelectedBrand('google');
    } else {
        setSelectedBrand(null);
    }

    setAgentForm(newAgent);
    setEditingAgentId(newId);
    setManualModelEntry(false);
  };

  const handleSaveAgent = () => {
    if (!editingAgentId || !agentForm.modelId || !agentForm.providerId) {
        error(t('settings.agents.agentNameRequired'));
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
      // Preview what the agent will look like
      const previewName = agentForm.modelId ? (agentForm.modelId.split('/').pop() || agentForm.modelId) : 'New Agent';
      
      // Use the avatar from the form state if it exists, otherwise calculate it (fallback)
      const brandFromId = getBrandFromModelId(agentForm.modelId || '');
      const effectiveAvatar = agentForm.avatar || BRAND_CONFIGS[brandFromId]?.logo || 'other';
      
      const isImageAvatar = effectiveAvatar.startsWith('http') || effectiveAvatar.startsWith('data:');

      // --- FILTER MODELS BY BRAND ---
      const filteredModels = selectedBrand 
        ? allAggregatedModels.filter(m => m.brand === selectedBrand)
        : allAggregatedModels;

      // --- PREPARE OPTIONS FOR ICON SELECT ---
      
      // 1. Brand Options
      const brandOptions: IconOption[] = availableBrands.map(b => ({
        value: b,
        label: BRAND_CONFIGS[b]?.name || b,
        icon: BRAND_CONFIGS[b]?.logo // Now returns a string key like 'deepseek'
      }));
      
      // 2. Model Options
      const modelOptions: IconOption[] = filteredModels.map(m => {
          const brand = getBrandFromModelId(m.modelId);
          const isThinking = isThinkingModel(m.modelId);
          const isNew = isNewModel(m.modelId);

          // Build badges array
          const badges: IconOption['badges'] = [];
          if (isNew) {
              badges.push({
                  label: 'NEW',
                  icon: <Sparkles size={10} />,
                  colorClass: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-emerald-300 shadow-sm"
              });
          }
          if (isThinking) {
              badges.push({
                  label: t('settings.editor.reasoningModel'),
                  icon: <BrainCircuit size={10} />,
                  colorClass: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 dark:from-purple-900/40 dark:to-violet-900/40 dark:text-purple-300 shadow-sm"
              });
          }

          return {
              value: m.modelId,
              label: m.modelId,
              subLabel: m.providerName,
              icon: BRAND_CONFIGS[brand]?.logo,
              badges: badges.length > 0 ? badges : undefined
          };
      });

      // 3. Provider Options (Only for Manual Mode)
      const providerOptions: IconOption[] = providers.map(p => {
        let iconKey = 'other';
        if (p.type === 'google') iconKey = 'google';
        else if (p.name.toLowerCase().includes('ollama')) iconKey = 'meta';
        else if (p.id === 'provider-openrouter') iconKey = 'openai';
        
        return { value: p.id, label: p.name, icon: iconKey };
      });

      return (
        <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
                <h3 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2"><Edit2 size={16}/> {t('settings.agents.edit')}</h3>
                <button onClick={() => setEditingAgentId(null)} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
            </div>

            {/* LIVE PREVIEW CARD */}
            <div className="bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-4 shadow-sm">
                 <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                     {isImageAvatar ? (
                        <img src={effectiveAvatar} alt="logo" className="w-10 h-10 object-contain" />
                     ) : (
                        <BrandIcon brand={effectiveAvatar} size={28} />
                     )}
                 </div>
                 <div className="flex-1">
                     <div className="text-xs text-gray-500 uppercase font-bold mb-0.5">{t('settings.editor.preview')}</div>
                     <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                         {previewName}
                         {isNewModel(agentForm.modelId || '') && (
                             <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-emerald-300 shadow-sm">
                                 <Sparkles size={10} />
                                 NEW
                             </span>
                         )}
                         {isThinkingModel(agentForm.modelId || '') && (
                             <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 dark:from-purple-900/40 dark:to-violet-900/40 dark:text-purple-300 shadow-sm">
                                 <BrainCircuit size={10} />
                                 {t('settings.editor.reasoningModel')}
                             </span>
                         )}
                     </div>
                 </div>
            </div>
            
            <div className="flex justify-end">
                 <button 
                    onClick={() => setManualModelEntry(!manualModelEntry)} 
                    className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors"
                 >
                    <Wrench size={12} />
                    {manualModelEntry ? t('settings.editor.guidedMode') : t('settings.editor.manualMode')}
                 </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                 
                 {!manualModelEntry ? (
                    /* GUIDED MODE: Brand -> Model */
                    <>
                        <div className="space-y-1 relative z-20">
                            <label className="text-xs font-bold text-gray-500 uppercase">1. {t('settings.agents.provider')}</label>
                            <IconSelect 
                                value={selectedBrand || ''}
                                onChange={(val) => {
                                    setSelectedBrand(val);
                                    // Clear model when brand changes to force re-selection
                                    setAgentForm({ ...agentForm, modelId: '' }); 
                                }}
                                options={brandOptions}
                                placeholder={t('settings.editor.selectBrand')}
                            />
                        </div>

                        <div className="space-y-1 relative z-10">
                            <label className="text-xs font-bold text-gray-500 uppercase">2. {t('settings.agents.modelId')}</label>
                            <IconSelect
                                value={agentForm.modelId || ''}
                                onChange={(val) => {
                                    // Find the model entry to get the correct providerId
                                    const entry = allAggregatedModels.find(m => m.modelId === val);
                                    if (entry) {
                                        const brand = getBrandFromModelId(val);
                                        const autoName = val.split('/').pop() || val;
                                        setAgentForm({
                                            ...agentForm,
                                            modelId: val,
                                            providerId: entry.providerId, // AUTO-ROUTE to correct provider
                                            name: autoName,
                                            avatar: BRAND_CONFIGS[brand]?.logo || 'other'
                                        });
                                    }
                                }}
                                options={modelOptions}
                                placeholder={t('settings.editor.selectModel')}
                                disabled={!selectedBrand}
                            />
                            {selectedBrand && filteredModels.length === 0 && (
                                <div className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                                    <Info size={10}/> {t('settings.editor.noModelsFound')}
                                </div>
                            )}
                        </div>
                    </>
                 ) : (
                    /* MANUAL MODE: Provider -> Text Input */
                    <>
                        <div className="space-y-1 relative z-20">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('settings.editor.providerConnection')}</label>
                            <IconSelect 
                                value={agentForm.providerId || ''}
                                onChange={(val) => setAgentForm({ ...agentForm, providerId: val })}
                                options={providerOptions}
                                placeholder={t('settings.editor.selectConnection')}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('settings.editor.manualModelId')}</label>
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
                                        avatar: BRAND_CONFIGS[brand]?.logo || 'other'
                                    })
                                }}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                placeholder={t('settings.editor.modelIdPlaceholder')}
                            />
                        </div>
                    </>
                 )}

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

            {/* --- Advanced Configuration (New Section) --- */}
             <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                    <Sliders size={12} />
                    {t('settings.editor.advanced')}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    {/* Temperature Control */}
                    <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between mb-1">
                            <label className="text-[10px] font-medium text-gray-500 uppercase">{t('settings.editor.temperature')}</label>
                            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">{agentForm.config?.temperature ?? 0.7}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="2" 
                            step="0.1"
                            value={agentForm.config?.temperature ?? 0.7}
                            onChange={(e) => setAgentForm({
                                ...agentForm,
                                config: { ...agentForm.config, temperature: parseFloat(e.target.value) }
                            })}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <div className="flex justify-between text-[8px] text-gray-400 mt-1">
                            <span>{t('settings.editor.precise')}</span>
                            <span>{t('settings.editor.creative')}</span>
                        </div>
                    </div>

                     {/* Top P Control */}
                    <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between mb-1">
                            <label className="text-[10px] font-medium text-gray-500 uppercase">{t('settings.editor.topP')}</label>
                            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">{agentForm.config?.topP ?? 0.95}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.05"
                            value={agentForm.config?.topP ?? 0.95}
                            onChange={(e) => setAgentForm({
                                ...agentForm,
                                config: { ...agentForm.config, topP: parseFloat(e.target.value) }
                            })}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <div className="flex justify-between text-[8px] text-gray-400 mt-1">
                            <span>{t('settings.editor.narrow')}</span>
                            <span>{t('settings.editor.broad')}</span>
                        </div>
                    </div>
                </div>

                {/* Max Tokens Input */}
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <label className="text-[10px] font-medium text-gray-500 uppercase">{t('settings.editor.maxTokens')}</label>
                    <input 
                        type="number"
                        min="1"
                        placeholder={t('settings.editor.noLimit')}
                        value={agentForm.config?.maxOutputTokens || ''}
                        onChange={(e) => setAgentForm({
                             ...agentForm,
                             config: { ...agentForm.config, maxOutputTokens: e.target.value ? parseInt(e.target.value) : undefined }
                        })}
                        className="w-24 text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                </div>
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
                                    <div key={agent.id} className={`relative group border-2 rounded-2xl p-5 transition-all duration-300 bg-gradient-to-br ${agent.enabled ? 'from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 border-blue-300 dark:border-blue-800 shadow-md hover:shadow-xl hover:scale-[1.02]' : 'from-white to-gray-50 dark:from-gray-900 dark:to-gray-900 border-gray-200 dark:border-gray-800 opacity-60 hover:opacity-80'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center shadow-lg overflow-hidden border-2 border-gray-100 dark:border-gray-700 flex-shrink-0">
                                                    {agent.avatar?.startsWith('http') ? (
                                                        <img src={agent.avatar} className="w-10 h-10 object-contain" alt="avatar"/>
                                                    ) : (
                                                        <BrandIcon brand={agent.avatar} size={28} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{agent.name}</h3>
                                                        {isNewModel(agent.modelId) && (
                                                            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-emerald-300 shadow-sm flex-shrink-0">
                                                                <Sparkles size={9} />
                                                                NEW
                                                            </span>
                                                        )}
                                                        {isThinkingModel(agent.modelId) && (
                                                            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 dark:from-purple-900/40 dark:to-violet-900/40 dark:text-purple-300 shadow-sm flex-shrink-0">
                                                                <BrainCircuit size={9} />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border shadow-sm ${isGoogle ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 dark:from-green-900/30 dark:to-emerald-900/20 dark:text-green-400 dark:border-green-900' : 'border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 dark:from-purple-900/30 dark:to-violet-900/20 dark:text-purple-400 dark:border-purple-900'}`}>
                                                            {provider?.name || t('common.unknown')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 flex-shrink-0">
                                                <button onClick={() => handleToggleAgent(agent.id)} className={`transition-colors ${agent.enabled ? 'text-blue-500 hover:text-blue-600' : 'text-gray-400 hover:text-gray-500'}`}>
                                                    {agent.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded flex-1">{agent.modelId}</p>
                                            <button
                                                onClick={() => handleEditAgent(agent)}
                                                className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                title={t('settings.agents.edit')}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {!editingAgentId && (
                            <button onClick={handleNewAgent} className="w-full py-5 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-2xl flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-300 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/30 dark:to-gray-900/20 hover:shadow-lg hover:scale-[1.01] group">
                                <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                    <Plus size={18} />
                                </div>
                                {t('settings.agents.new')}
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
                         <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg flex gap-3">
                            <div className="text-yellow-600 dark:text-yellow-500 mt-0.5"><ShieldCheck size={18} /></div>
                            <div className="text-sm text-yellow-900 dark:text-yellow-100">
                                <p className="font-semibold mb-1">{t('settings.providers.securityWarning')}</p>
                                <p className="opacity-80">{t('settings.providers.securityWarningDesc')}</p>
                            </div>
                         </div>
                        <div className="space-y-4">
                            {providers.map(provider => (
                                <div key={provider.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-900 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm ${provider.type === 'google' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'}`}>
                                                {provider.type === 'google' ? (
                                                     <BrandIcon brand="google" size={20} />
                                                ) : (
                                                    <Server size={20} />
                                                )}
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
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                                    <Download size={24} className="rotate-180" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('settings.data.import')}</h3>
                                    <p className="text-sm text-gray-500 mt-1 mb-4">{t('settings.data.importDesc')}</p>
                                    <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors cursor-pointer inline-block">
                                        {t('settings.data.upload')}
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={onImportData}
                                            className="hidden"
                                        />
                                    </label>
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
