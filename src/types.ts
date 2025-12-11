export type ProviderType = 'google' | 'openai-compatible';

export interface AppSettings {
  theme: 'light' | 'dark';
  enterToSend: boolean;
  language: 'en' | 'zh';
}

// Test case for model comparison
export interface TestCase {
  id: string;
  title: string;
  prompt: string;
  category: TestCaseCategory;
  isCustom?: boolean; // User-created test case
  isFavorite?: boolean;
  createdAt?: number;
}

export type TestCaseCategory =
  | 'conversation' // 对话能力
  | 'coding' // 编程能力
  | 'writing' // 写作能力
  | 'reasoning' // 推理能力
  | 'multilingual' // 多语言能力
  | 'knowledge' // 知识问答
  | 'creative' // 创意生成
  | 'trending' // 热点话题
  | 'custom'; // 自定义收藏

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

export interface MessageRating {
  userRating?: number; // 1-5 stars, user's subjective rating
  isMarkedAsBest?: boolean; // Flag for "best response" in comparison
  metrics?: {
    responseTime?: number; // Time in milliseconds from request to completion
    outputLength?: number; // Character count of response
    tokensPerSecond?: number; // Generation speed metric
    completenessScore?: number; // 0-100, estimated completeness (future: AI-based)
  };
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
  rating?: MessageRating; // Quality metrics and user ratings
  streamStartTime?: number; // For calculating response time
  streamEndTime?: number; // For calculating response time
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  sessionTokenUsage?: {
    totalTokens: number;
    totalCost: number;
  };
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
  ERROR,
}
