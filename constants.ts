
import { AgentConfig, LLMProvider, AppSettings } from "./types";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  enterToSend: true,
  language: 'en'
};

// --- Brand & Logo Assets ---
// Using high-availability CDNs (Wikimedia Commons, etc.)
export const BRAND_CONFIGS: Record<string, { name: string; logo: string; keywords: string[] }> = {
  openai: {
    name: 'OpenAI',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
    keywords: ['openai', 'gpt']
  },
  google: {
    name: 'Google',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg',
    keywords: ['google', 'gemini']
  },
  anthropic: {
    name: 'Anthropic',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg',
    keywords: ['anthropic', 'claude']
  },
  deepseek: {
    name: 'DeepSeek',
    logo: 'https://avatars.githubusercontent.com/u/148330874?s=200&v=4', // Official GitHub Avatar
    keywords: ['deepseek']
  },
  meta: {
    name: 'Meta (Llama)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png',
    keywords: ['meta', 'llama', 'facebook']
  },
  mistral: {
    name: 'Mistral',
    logo: 'https://assets-global.website-files.com/65107f01d670595d376056b9/651082c1182b8592c324216e_Mistral%20AI%20Symbol%20(1).svg',
    keywords: ['mistral', 'mixtral']
  },
  xai: {
    name: 'xAI (Grok)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png',
    keywords: ['x-ai', 'grok']
  },
  other: {
    name: 'Other',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg', // Generic placeholder
    keywords: []
  }
};

export const getBrandFromModelId = (modelId: string): keyof typeof BRAND_CONFIGS => {
  const lower = modelId.toLowerCase();
  
  // 1. Check for OpenRouter style prefix (vendor/model)
  if (lower.includes('/')) {
      const prefix = lower.split('/')[0];
      for (const [key, config] of Object.entries(BRAND_CONFIGS)) {
          if (config.keywords.some(k => prefix.includes(k))) return key;
      }
  }

  // 2. Keyword search
  for (const [key, config] of Object.entries(BRAND_CONFIGS)) {
      if (config.keywords.some(k => lower.includes(k))) return key;
  }

  return 'other';
};

export const DEFAULT_PROVIDERS: LLMProvider[] = [
  {
    id: 'provider-google',
    name: 'Google Gemini',
    type: 'google',
    apiKey: '', // Uses env if empty, or user input
    enabled: true,
    suggestedModels: [
        'gemini-2.5-flash', 
        'gemini-2.0-pro-exp', 
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
    suggestedModels: [
      'deepseek/deepseek-r1',
      'deepseek/deepseek-chat',
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.3-70b-instruct',
    ]
  }
];

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agent-analyst',
    name: 'Gemini Analyst',
    avatar: BRAND_CONFIGS.google.logo,
    providerId: 'provider-google',
    modelId: 'gemini-2.5-flash',
    systemPrompt: 'You are a rigorous logic analyst. Break down the user query into facts, analyze pros/cons, and provide a structured, objective response. Avoid emotional language.',
    enabled: true,
  },
  {
    id: 'agent-deepseek-r1',
    name: 'DeepSeek R1',
    avatar: BRAND_CONFIGS.deepseek.logo,
    providerId: 'provider-openrouter',
    modelId: 'deepseek/deepseek-r1',
    systemPrompt: 'You are a reasoning engine. Show your chain of thought clearly.',
    enabled: true,
  },
  {
    id: 'agent-claude',
    name: 'Claude Sonnet',
    avatar: BRAND_CONFIGS.anthropic.logo,
    providerId: 'provider-openrouter',
    modelId: 'anthropic/claude-3.5-sonnet',
    systemPrompt: 'You are a helpful assistant with a focus on high-quality writing and nuance.',
    enabled: false,
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
    label: 'Code Expert',
    icon: '💻',
    prompt: 'You are an expert software engineer. Provide clean, efficient, and well-documented code. Explain your logic clearly and prioritize best practices.'
  },
  {
    label: 'Creative Writer',
    icon: '✍️',
    prompt: 'You are a creative writer with a flair for vivid imagery and emotional depth. Engage the reader with compelling narratives and unique perspectives.'
  },
  {
    label: 'Concise Assistant',
    icon: '⚡',
    prompt: 'Be extremely concise. Answer directly without filler words or preamble.'
  },
  {
    label: 'Translator',
    icon: '🌐',
    prompt: 'You are a professional translator. Translate the following content accurately, preserving the tone and cultural nuance of the original text.'
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
