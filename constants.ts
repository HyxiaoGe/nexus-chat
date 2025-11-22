
import { AgentConfig, LLMProvider, AppSettings } from "./types";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  enterToSend: true,
  language: 'zh'
};

// Keys match the mapping in components/BrandIcons.tsx
export const BRAND_CONFIGS: Record<string, { name: string; logo: string; keywords: string[] }> = {
  openai: {
    name: 'OpenAI',
    logo: 'openai', 
    keywords: ['openai', 'gpt', 'o1-', 'o1-mini', 'o1-preview']
  },
  google: {
    name: 'Google Gemini',
    logo: 'gemini', // Changed to gemini for the sparkle icon
    keywords: ['google', 'gemini']
  },
  anthropic: {
    name: 'Anthropic',
    logo: 'anthropic',
    keywords: ['anthropic', 'claude']
  },
  deepseek: {
    name: 'DeepSeek',
    logo: 'deepseek',
    keywords: ['deepseek']
  },
  meta: {
    name: 'Meta Llama',
    logo: 'meta',
    keywords: ['meta', 'llama', 'facebook']
  },
  mistral: {
    name: 'Mistral AI',
    logo: 'mistral',
    keywords: ['mistral', 'mixtral', 'pixtral']
  },
  xai: {
    name: 'xAI (Grok)',
    logo: 'grok',
    keywords: ['x-ai', 'grok']
  },
  perplexity: {
    name: 'Perplexity',
    logo: 'perplexity',
    keywords: ['perplexity', 'sonar']
  },
  qwen: {
    name: 'Qwen (Alibaba)',
    logo: 'qwen',
    keywords: ['qwen']
  },
  minimax: {
    name: 'MiniMax',
    logo: 'minimax', 
    keywords: ['minimax']
  },
  microsoft: {
    name: 'Microsoft',
    logo: 'microsoft',
    keywords: ['microsoft', 'phi']
  },
  other: {
    name: 'Assistant',
    logo: 'other', 
    keywords: []
  }
};

export const getBrandFromModelId = (modelId: string): keyof typeof BRAND_CONFIGS => {
  const lower = modelId.toLowerCase();
  
  // 1. Check for specific keywords first
  for (const [key, config] of Object.entries(BRAND_CONFIGS)) {
      if (config.keywords.some(k => lower.includes(k))) return key;
  }

  // 2. Fallback for OpenRouter prefixes (vendor/model)
  if (lower.includes('/')) {
      const prefix = lower.split('/')[0];
      // Try to match prefix again
      for (const [key, config] of Object.entries(BRAND_CONFIGS)) {
          if (config.keywords.some(k => prefix.includes(k))) return key;
      }
  }

  return 'other';
};

export const DEFAULT_PROVIDERS: LLMProvider[] = [
  {
    id: 'provider-google',
    name: 'Google Gemini',
    type: 'google',
    apiKey: '', // Uses env if empty
    enabled: true,
    suggestedModels: [
        'gemini-2.5-flash', 
        'gemini-2.0-flash-thinking-exp-01-21',
        'gemini-2.0-pro-exp-02-05',
        'gemini-1.5-pro', 
        'gemini-1.5-flash'
    ]
  },
  {
    id: 'provider-openrouter',
    name: 'OpenRouter',
    type: 'openai-compatible',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: '',
    enabled: true,
    // Comprehensive list of mainstream models
    suggestedModels: [
      // OpenAI
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/o1-preview',
      'openai/o1-mini',
      
      // Anthropic
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3.5-haiku',
      'anthropic/claude-3-opus',
      
      // DeepSeek
      'deepseek/deepseek-r1',
      'deepseek/deepseek-v3',
      
      // Google (via OpenRouter)
      'google/gemini-2.0-flash-001',
      'google/gemini-2.0-pro-exp-02-05',
      
      // Meta
      'meta-llama/llama-3.3-70b-instruct',
      'meta-llama/llama-3.1-405b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct',
      
      // Mistral
      'mistralai/mistral-large-2411',
      'mistralai/pixtral-large-2411',
      'mistralai/mistral-small-2402',
      
      // Perplexity
      'perplexity/llama-3.1-sonar-huge-128k-online',
      
      // xAI
      'x-ai/grok-2-1212',
      
      // Qwen
      'qwen/qwen-2.5-72b-instruct',
      'qwen/qwen-2.5-coder-32b-instruct',
      
      // Microsoft
      'microsoft/phi-4',
    ]
  }
];

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agent-gemini-flash',
    name: 'Gemini Flash',
    avatar: 'gemini', 
    providerId: 'provider-google',
    modelId: 'gemini-2.5-flash',
    systemPrompt: '你是一个乐于助人且反应迅速的助手。',
    enabled: true,
    config: {
      temperature: 0.7,
      maxOutputTokens: 8192
    }
  },
  {
    id: 'agent-deepseek-r1',
    name: 'DeepSeek R1',
    avatar: 'deepseek',
    providerId: 'provider-openrouter',
    modelId: 'deepseek/deepseek-r1',
    systemPrompt: '你是一个推理引擎。请在 <think> 标签内清晰地展示你的思维链。',
    enabled: true,
    config: {
      temperature: 0.6
    }
  },
  {
    id: 'agent-claude-sonnet',
    name: 'Claude Sonnet',
    avatar: 'anthropic',
    providerId: 'provider-openrouter',
    modelId: 'anthropic/claude-3.5-sonnet',
    systemPrompt: '你是 Claude，由 Anthropic 创建的人工智能助手。',
    enabled: false,
    config: {
      temperature: 0.7
    }
  },
  {
    id: 'agent-gpt4o',
    name: 'GPT-4o',
    avatar: 'openai',
    providerId: 'provider-openrouter',
    modelId: 'openai/gpt-4o',
    systemPrompt: '你是一个乐于助人的助手。',
    enabled: false,
    config: {
      temperature: 0.7
    }
  }
];

export const STORAGE_KEYS = {
  SESSIONS: 'nexus_sessions',
  MESSAGES: 'nexus_messages',
  PROVIDERS: 'nexus_providers',
  AGENTS: 'nexus_agents',
  SETTINGS: 'nexus_settings',
};

// --- UX Presets ---

export const SYSTEM_PROMPT_TEMPLATES = [
  {
    label: '代码专家',
    icon: '💻',
    prompt: '你是一位软件工程专家。请提供清晰、高效且文档齐全的代码。解释你的逻辑并优先考虑最佳实践。'
  },
  {
    label: '创意写作',
    icon: '✍️',
    prompt: '你是一位富有创造力的作家，擅长生动的意象和情感深度。用引人入胜的叙述和独特的视角吸引读者。'
  },
  {
    label: '简洁助手',
    icon: '⚡',
    prompt: '非常简洁。直接回答，不要废话或开场白。'
  },
  {
    label: '翻译员',
    icon: '🌐',
    prompt: '你是一位专业翻译。准确翻译以下内容，保留原文的语气和文化细微差别。'
  }
];

export const PROVIDER_PRESETS = [
  {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    icon: '🦙'
  },
  {
    name: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1',
    icon: '🖥️'
  },
  {
    name: 'LocalAI',
    baseUrl: 'http://localhost:8080/v1',
    icon: '🏠'
  }
];
