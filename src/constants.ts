import { AgentConfig, LLMProvider, AppSettings } from './types';
import { getSystemPrompt } from './data/systemPrompts';

// Detect browser language and default to it if supported
const detectBrowserLanguage = (): 'en' | 'zh' => {
  const browserLang = navigator.language.toLowerCase();
  // Check if browser language starts with 'zh' (zh, zh-CN, zh-TW, etc.)
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }
  // Default to English for all other languages
  return 'en';
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'light',
  enterToSend: true,
  language: detectBrowserLanguage(),
};

// Supported model providers - Keys match the mapping in components/BrandIcons.tsx
export const BRAND_CONFIGS: Record<string, { name: string; logo: string }> = {
  openai: {
    name: 'OpenAI',
    logo: 'openai',
  },
  google: {
    name: 'Google Gemini',
    logo: 'gemini',
  },
  anthropic: {
    name: 'Anthropic',
    logo: 'anthropic',
  },
  'x-ai': {
    name: 'xAI (Grok)',
    logo: 'grok',
  },
  qwen: {
    name: 'Qwen (Alibaba)',
    logo: 'qwen',
  },
  deepseek: {
    name: 'DeepSeek',
    logo: 'deepseek',
  },
  moonshot: {
    name: 'Moonshot AI',
    logo: 'moonshot',
  },
  zhipuai: {
    name: 'Zhipu AI (智谱)',
    logo: 'zhipu',
  },
  minimax: {
    name: 'MiniMax',
    logo: 'minimax',
  },
  other: {
    name: 'Assistant',
    logo: 'other',
  },
};

// Extract brand from model ID (e.g., "anthropic/claude-3.5" -> "anthropic")
export const getBrandFromModelId = (modelId: string): keyof typeof BRAND_CONFIGS => {
  const lower = modelId.toLowerCase();

  // Extract vendor from OpenRouter format (vendor/model-name)
  if (lower.includes('/')) {
    const vendor = lower.split('/')[0];

    // Direct match with our supported brands
    if (vendor in BRAND_CONFIGS) {
      return vendor as keyof typeof BRAND_CONFIGS;
    }

    // Handle vendor aliases
    const aliases: Record<string, keyof typeof BRAND_CONFIGS> = {
      'meta-llama': 'other',
      mistralai: 'other',
      microsoft: 'other',
      perplexity: 'other',
      nvidia: 'other',
      meta: 'other',
    };

    if (vendor in aliases) {
      return aliases[vendor];
    }
  }

  // For non-OpenRouter format (e.g., Gemini direct API)
  if (lower.includes('gemini') || lower.includes('google')) return 'google';
  if (lower.includes('gpt') || lower.includes('o1-') || lower.includes('o3-')) return 'openai';
  if (lower.includes('claude')) return 'anthropic';
  if (lower.includes('deepseek')) return 'deepseek';
  if (lower.includes('grok')) return 'x-ai';
  if (lower.includes('qwen')) return 'qwen';
  if (lower.includes('moonshot')) return 'moonshot';
  if (lower.includes('glm') || lower.includes('zhipu')) return 'zhipuai';
  if (lower.includes('minimax')) return 'minimax';

  return 'other';
};

// Helper to identify reasoning/thinking models
export const isThinkingModel = (modelId: string): boolean => {
  const lower = modelId.toLowerCase();
  return (
    lower.includes('deepseek-r1') ||
    lower.includes('o1-') ||
    lower.includes('o3-') ||
    lower.includes('thinking') ||
    lower.includes('reasoning')
  );
};

// Helper to identify new models (released in the last 6 months)
export const isNewModel = (createdTimestamp?: number): boolean => {
  if (!createdTimestamp) return false;
  const sixMonthsAgo = Date.now() / 1000 - 6 * 30 * 24 * 60 * 60;
  return createdTimestamp > sixMonthsAgo;
};

export const DEFAULT_PROVIDERS: LLMProvider[] = [
  {
    id: 'provider-openrouter',
    name: 'OpenRouter',
    type: 'openai-compatible',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: '',
    enabled: true,
    // Fallback models (will be replaced by dynamic fetching)
    suggestedModels: [
      'anthropic/claude-opus-4.5',
      'openai/gpt-5.1-chat',
      'google/gemini-3-pro-preview',
      'deepseek/deepseek-r1',
      'x-ai/grok-4.1-fast',
      'qwen/qwen3-max',
      'moonshotai/kimi-k2-thinking',
      'z-ai/glm-4.6',
      'minimax/minimax-m2',
    ],
  },
];

// Get default system prompts based on browser language
const defaultLang = detectBrowserLanguage();

export const DEFAULT_AGENTS: AgentConfig[] = [
  // Default enabled agents (4)
  {
    id: 'agent-anthropic',
    name: 'Anthropic Claude',
    avatar: 'anthropic',
    providerId: 'provider-openrouter',
    modelId: 'anthropic/claude-opus-4.5',
    systemPrompt: getSystemPrompt('general', defaultLang),
    enabled: true,
    config: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  },
  {
    id: 'agent-openai',
    name: 'OpenAI GPT',
    avatar: 'openai',
    providerId: 'provider-openrouter',
    modelId: 'openai/gpt-5.1-chat',
    systemPrompt: getSystemPrompt('general', defaultLang),
    enabled: true,
    config: {
      temperature: 0.7,
    },
  },
  {
    id: 'agent-google',
    name: 'Google Gemini',
    avatar: 'gemini',
    providerId: 'provider-openrouter',
    modelId: 'google/gemini-3-pro-preview',
    systemPrompt: getSystemPrompt('general', defaultLang),
    enabled: true,
    config: {
      temperature: 0.7,
    },
  },
  {
    id: 'agent-deepseek',
    name: 'DeepSeek',
    avatar: 'deepseek',
    providerId: 'provider-openrouter',
    modelId: 'deepseek/deepseek-r1',
    systemPrompt: getSystemPrompt('reasoning', defaultLang),
    enabled: true,
    config: {
      temperature: 0.6,
    },
  },
  // Disabled agents
  {
    id: 'agent-xai',
    name: 'xAI Grok',
    avatar: 'grok',
    providerId: 'provider-openrouter',
    modelId: 'x-ai/grok-4.1-fast',
    systemPrompt: getSystemPrompt('general', defaultLang),
    enabled: false,
    config: {
      temperature: 0.7,
    },
  },
  {
    id: 'agent-qwen',
    name: 'Qwen (通义千问)',
    avatar: 'qwen',
    providerId: 'provider-openrouter',
    modelId: 'qwen/qwen3-max',
    systemPrompt: getSystemPrompt('general', defaultLang),
    enabled: false,
    config: {
      temperature: 0.7,
    },
  },
  {
    id: 'agent-moonshot',
    name: 'Moonshot AI',
    avatar: 'moonshot',
    providerId: 'provider-openrouter',
    modelId: 'moonshotai/kimi-k2-thinking',
    systemPrompt: getSystemPrompt('general', defaultLang),
    enabled: false,
    config: {
      temperature: 0.7,
    },
  },
  {
    id: 'agent-zhipu',
    name: 'Zhipu AI (智谱)',
    avatar: 'zhipu',
    providerId: 'provider-openrouter',
    modelId: 'z-ai/glm-4.6',
    systemPrompt: getSystemPrompt('general', defaultLang),
    enabled: false,
    config: {
      temperature: 0.7,
    },
  },
  {
    id: 'agent-minimax',
    name: 'MiniMax',
    avatar: 'minimax',
    providerId: 'provider-openrouter',
    modelId: 'minimax/minimax-m2',
    systemPrompt: getSystemPrompt('general', defaultLang),
    enabled: false,
    config: {
      temperature: 0.7,
    },
  },
];

export const STORAGE_KEYS = {
  SESSIONS: 'nexus_sessions',
  MESSAGES: 'nexus_messages',
  PROVIDERS: 'nexus_providers',
  AGENTS: 'nexus_agents',
  SETTINGS: 'nexus_settings',
  TOKEN_STATS: 'nexus_token_stats',
  CUSTOM_TEST_CASES: 'nexus_custom_test_cases',
};

// --- UX Presets ---

// System prompt template selectors (UI only, full templates in systemPrompts.ts)
export const SYSTEM_PROMPT_TEMPLATE_SELECTORS = [
  { id: 'general', icon: '🤖', label: { en: 'General', zh: '通用' } },
  { id: 'conversation', icon: '💬', label: { en: 'Conversation', zh: '对话' } },
  { id: 'coding', icon: '💻', label: { en: 'Coding', zh: '编程' } },
  { id: 'writing', icon: '✍️', label: { en: 'Writing', zh: '写作' } },
  { id: 'reasoning', icon: '🧠', label: { en: 'Reasoning', zh: '推理' } },
  { id: 'multilingual', icon: '🌐', label: { en: 'Translation', zh: '翻译' } },
  { id: 'knowledge', icon: '📚', label: { en: 'Knowledge', zh: '知识' } },
  { id: 'creative', icon: '🎨', label: { en: 'Creative', zh: '创意' } },
];

export const PROVIDER_PRESETS = [
  {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    icon: '🦙',
  },
  {
    name: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1',
    icon: '🖥️',
  },
  {
    name: 'LocalAI',
    baseUrl: 'http://localhost:8080/v1',
    icon: '🏠',
  },
];
