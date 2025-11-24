
export type ProviderType = 'google' | 'openai-compatible';

export interface AppSettings {
  theme: 'light' | 'dark';
  enterToSend: boolean;
  language: 'en' | 'zh';
}

// OpenRouter API model metadata
export interface OpenRouterModel {
  id: string;
  name: string;
  created: number; // Unix timestamp
  description?: string;
  context_length: number;
  max_completion_tokens?: number;
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    request: string;
  };
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
  top_provider?: string;
  supported_parameters?: string[];
}

export interface LLMProvider {
  id: string;
  name: string;
  type: ProviderType;
  baseURL?: string;
  apiKey: string; // Stored locally
  enabled: boolean;
  isCustom?: boolean;
  suggestedModels: string[]; // Helper for default suggestions (fallback)
  fetchedModels?: OpenRouterModel[]; // Models fetched dynamically from the API (e.g. OpenRouter)
  lastFetched?: number; // Timestamp of last fetch for cache invalidation
}

export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  avatar: string; // Color hex or emoji
  providerId: string; // Links to LLMProvider
  modelId: string; // e.g., gemini-2.5-flash, deepseek-chat
  systemPrompt: string;
  enabled: boolean;
  config?: GenerationConfig; // New field for advanced settings
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number; // In USD
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  agentId?: string; // Replaces modelConfigId
  isStreaming?: boolean;
  error?: string;
  tokenUsage?: TokenUsage; // Token consumption stats
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface TokenStats {
  byModel: {
    [modelId: string]: {
      totalTokens: number;
      totalCost: number;
      requestCount: number;
      lastUsed: number;
    };
  };
}

export enum LoadingState {
  IDLE,
  STREAMING,
  ERROR
}