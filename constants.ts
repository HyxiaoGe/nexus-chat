
import { AgentConfig, LLMProvider, AppSettings } from "./types";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  enterToSend: true,
  language: 'en'
};

// --- Brand & Logo Assets (Powered by LobeHub Icons) ---
// Using jsDelivr CDN for LobeHub static assets which are high quality, consistent and fast
const LOBEHUB_ICON_BASE = "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark";

export const BRAND_CONFIGS: Record<string, { name: string; logo: string; keywords: string[] }> = {
  openai: {
    name: 'OpenAI',
    logo: `${LOBEHUB_ICON_BASE}/openai.png`,
    keywords: ['openai', 'gpt']
  },
  google: {
    name: 'Google Gemini',
    logo: `${LOBEHUB_ICON_BASE}/gemini.png`,
    keywords: ['google', 'gemini']
  },
  anthropic: {
    name: 'Anthropic',
    logo: `${LOBEHUB_ICON_BASE}/claude.png`,
    keywords: ['anthropic', 'claude']
  },
  deepseek: {
    name: 'DeepSeek',
    logo: `${LOBEHUB_ICON_BASE}/deepseek.png`, // DeepSeek icon
    keywords: ['deepseek']
  },
  meta: {
    name: 'Meta Llama',
    logo: `${LOBEHUB_ICON_BASE}/meta.png`,
    keywords: ['meta', 'llama', 'facebook']
  },
  mistral: {
    name: 'Mistral AI',
    logo: `${LOBEHUB_ICON_BASE}/mistral.png`,
    keywords: ['mistral', 'mixtral']
  },
  xai: {
    name: 'xAI (Grok)',
    logo: `${LOBEHUB_ICON_BASE}/grok.png`,
    keywords: ['x-ai', 'grok']
  },
  perplexity: {
    name: 'Perplexity',
    logo: `${LOBEHUB_ICON_BASE}/perplexity.png`,
    keywords: ['perplexity', 'sonar']
  },
  qwen: {
    name: 'Qwen (Alibaba)',
    logo: `${LOBEHUB_ICON_BASE}/qwen.png`,
    keywords: ['qwen']
  },
  minimax: {
    name: 'MiniMax',
    logo: `${LOBEHUB_ICON_BASE}/minimax.png`,
    keywords: ['minimax']
  },
  other: {
    name: 'Assistant',
    logo: `${LOBEHUB_ICON_BASE}/llm.png`, // Generic LLM icon
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
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.3-70b-instruct',
    ]
  }
];

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agent-analyst',
    name: 'Gemini Flash',
    avatar: BRAND_CONFIGS.google.logo,
    providerId: 'provider-google',
    modelId: 'gemini-2.5-flash',
    systemPrompt: 'You are a helpful assistant.',
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
