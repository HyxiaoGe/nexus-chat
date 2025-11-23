
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
    keywords: ['openai', 'gpt', 'o1-', 'o3-', 'o5-']
  },
  google: {
    name: 'Google Gemini',
    logo: 'gemini', // Changed to gemini for the sparkle icon
    keywords: ['google', 'gemini', 'veo']
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
    keywords: ['mistral', 'mixtral', 'pixtral', 'codestral']
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
  nvidia: {
    name: 'NVIDIA',
    logo: 'nvidia', // Maps to fallback if icon not found, but keyword helps grouping
    keywords: ['nvidia', 'nemotron']
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

export const DEFAULT_PROVIDERS: LLMProvider[] = [
  {
    id: 'provider-google',
    name: 'Google Gemini (Native)',
    type: 'google',
    apiKey: '', // Uses env if empty
    enabled: false, // Disabled by default to unify usage under OpenRouter
    suggestedModels: [
        'gemini-3-pro-preview',
        'gemini-3-flash-preview',
        'gemini-3-ultra-preview',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite-preview-02-05',
        'gemini-2.0-pro-exp-02-05',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-2.0-flash-thinking-exp-01-21'
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
      // --- OpenAI ---
      'openai/gpt-5.1',
      'openai/gpt-5-turbo',
      'openai/gpt-4.5-preview', 
      'openai/gpt-4.5-turbo',
      'openai/o3-mini',
      'openai/o1',
      'openai/o1-mini',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/gpt-4-turbo',

      // --- Anthropic ---
      // Future / Next Gen
      'anthropic/claude-4.5-opus',
      'anthropic/claude-4.5-sonnet',
      'anthropic/claude-4.5-haiku',
      'anthropic/claude-4-opus',
      'anthropic/claude-4-sonnet',
      
      // Current Gen
      'anthropic/claude-3.7-sonnet',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3.5-haiku',
      'anthropic/claude-3-opus',

      // --- Google ---
      'google/gemini-3-ultra-preview',
      'google/gemini-3-pro-preview',
      'google/gemini-3-flash-preview',
      'google/gemini-2.0-flash-001',
      'google/gemini-2.0-flash-lite-preview-02-05',
      'google/gemini-2.0-pro-exp-02-05',
      'google/gemini-flash-1.5',
      'google/gemini-pro-1.5',
      'google/gemini-2.0-flash-thinking-exp-01-21',
      
      // --- DeepSeek ---
      'deepseek/deepseek-r1',
      'deepseek/deepseek-chat', // V3
      
      // --- xAI (Grok) ---
      'x-ai/grok-3',
      'x-ai/grok-2-1212',
      
      // --- Meta Llama ---
      'meta-llama/llama-3.3-70b-instruct',
      'meta-llama/llama-3.2-90b-vision-instruct',
      'meta-llama/llama-3.1-405b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      
      // --- Mistral ---
      'mistralai/mistral-large-2411',
      'mistralai/codestral-2501',
      'mistralai/mistral-small-2402',
      
      // --- Perplexity ---
      'perplexity/sonar-reasoning-pro',
      'perplexity/sonar-reasoning',
      
      // --- Qwen ---
      'qwen/qwen-2.5-72b-instruct',
      'qwen/qwen-2.5-coder-32b-instruct',

      // --- Nvidia ---
      'nvidia/llama-3.1-nemotron-70b-instruct',
      
      // --- Microsoft ---
      'microsoft/phi-4'
    ]
  }
];

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agent-gemini-3',
    name: 'Gemini 3 Pro',
    avatar: 'gemini', 
    providerId: 'provider-openrouter', // Unified to OpenRouter
    modelId: 'google/gemini-3-pro-preview', // OpenRouter model format
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
    id: 'agent-claude-4-5',
    name: 'Claude 4.5',
    avatar: 'anthropic',
    providerId: 'provider-openrouter',
    modelId: 'anthropic/claude-4.5-sonnet',
    systemPrompt: '你是 Claude，由 Anthropic 创建的人工智能助手。',
    enabled: false,
    config: {
      temperature: 0.7
    }
  },
  {
    id: 'agent-gpt-5',
    name: 'GPT-5.1',
    avatar: 'openai',
    providerId: 'provider-openrouter',
    modelId: 'openai/gpt-5.1',
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
