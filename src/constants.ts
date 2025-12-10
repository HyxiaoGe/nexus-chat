import { AgentConfig, LLMProvider, AppSettings } from './types';

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
  theme: 'dark',
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

export const DEFAULT_AGENTS: AgentConfig[] = [
  // Default enabled agents (4)
  {
    id: 'agent-anthropic',
    name: 'Anthropic Claude',
    avatar: 'anthropic',
    providerId: 'provider-openrouter',
    modelId: 'anthropic/claude-opus-4.5',
    systemPrompt: '你是 Claude，由 Anthropic 创建的人工智能助手。',
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
    systemPrompt: '你是一个乐于助人的助手。',
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
    systemPrompt: '你是一个乐于助人且反应迅速的助手。',
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
    systemPrompt: '你是一个推理引擎。请在 <think> 标签内清晰地展示你的思维链。',
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
    systemPrompt: '你是 Grok，一个由 xAI 开发的 AI 助手。',
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
    systemPrompt: '你是通义千问，由阿里巴巴开发的大语言模型。',
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
    systemPrompt: '你是 Kimi，由 Moonshot AI 开发的智能助手。',
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
    systemPrompt: '你是智谱清言，由智谱 AI 开发的语言模型。',
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
    systemPrompt: '你是 MiniMax 智能助手。',
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

export const SYSTEM_PROMPT_TEMPLATES = [
  {
    label: '代码专家',
    icon: '💻',
    prompt:
      '你是一位软件工程专家。请提供清晰、高效且文档齐全的代码。解释你的逻辑并优先考虑最佳实践。',
  },
  {
    label: '创意写作',
    icon: '✍️',
    prompt:
      '你是一位富有创造力的作家，擅长生动的意象和情感深度。用引人入胜的叙述和独特的视角吸引读者。',
  },
  {
    label: '简洁助手',
    icon: '⚡',
    prompt: '非常简洁。直接回答，不要废话或开场白。',
  },
  {
    label: '翻译员',
    icon: '🌐',
    prompt: '你是一位专业翻译。准确翻译以下内容，保留原文的语气和文化细微差别。',
  },
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
