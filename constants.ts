
import { AgentConfig, LLMProvider, AppSettings } from "./types";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  enterToSend: true,
  language: 'en'
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
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b'
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
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-pro-1.5',
      'mistralai/mistral-large',
      'x-ai/grok-2'
    ]
  }
];

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agent-analyst',
    name: 'Gemini Analyst',
    avatar: '📊',
    providerId: 'provider-google',
    modelId: 'gemini-2.5-flash',
    systemPrompt: 'You are a rigorous logic analyst. Break down the user query into facts, analyze pros/cons, and provide a structured, objective response. Avoid emotional language.',
    enabled: true,
  },
  {
    id: 'agent-deepseek-r1',
    name: 'DeepSeek R1',
    avatar: '🧠',
    providerId: 'provider-openrouter',
    modelId: 'deepseek/deepseek-r1',
    systemPrompt: 'You are a reasoning engine. Show your chain of thought clearly.',
    enabled: true,
  },
  {
    id: 'agent-claude',
    name: 'Claude Sonnet',
    avatar: '🖋️',
    providerId: 'provider-openrouter',
    modelId: 'anthropic/claude-3.5-sonnet',
    systemPrompt: 'You are a helpful assistant with a focus on high-quality writing and nuance.',
    enabled: false,
  },
  {
    id: 'agent-llama',
    name: 'Llama 3.3',
    avatar: '🦙',
    providerId: 'provider-openrouter',
    modelId: 'meta-llama/llama-3.3-70b-instruct',
    systemPrompt: 'You are a helpful assistant. Be extremely concise and fast.',
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
  },
  {
    label: 'Socratic Tutor',
    icon: '🎓',
    prompt: 'You are a tutor who helps students learn by asking guiding questions. Do not give the answer directly; instead, lead the user to the solution.'
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
