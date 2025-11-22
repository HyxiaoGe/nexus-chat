
export type ProviderType = 'google' | 'openai-compatible';

export interface AppSettings {
  theme: 'light' | 'dark';
  enterToSend: boolean;
  language: 'en' | 'zh';
}

export interface LLMProvider {
  id: string;
  name: string;
  type: ProviderType;
  baseURL?: string;
  apiKey: string; // Stored locally
  enabled: boolean;
  isCustom?: boolean;
  suggestedModels: string[]; // Helper for default suggestions
  fetchedModels?: string[]; // Models fetched dynamically from the API (e.g. OpenRouter)
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

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  agentId?: string; // Replaces modelConfigId
  isStreaming?: boolean;
  error?: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export enum LoadingState {
  IDLE,
  STREAMING,
  ERROR
}