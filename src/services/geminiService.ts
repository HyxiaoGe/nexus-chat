import { GoogleGenAI } from '@google/genai';
import { AgentConfig, LLMProvider, OpenRouterModel, TokenUsage } from '../types';

const MODEL_CACHE_PREFIX = 'nexus_models_cache_';
export const DEFAULT_MODEL_CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface ModelCacheEntry {
  timestamp: number;
  models: OpenRouterModel[];
}

export interface ModelFetchResult {
  models: OpenRouterModel[];
  fromCache: boolean;
  offlineFallback: boolean;
  timestamp: number;
}

const getCacheKey = (providerId: string) => `${MODEL_CACHE_PREFIX}${providerId}`;

const loadCachedModels = (providerId: string): ModelCacheEntry | null => {
  try {
    const raw = localStorage.getItem(getCacheKey(providerId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ModelCacheEntry;
    if (!Array.isArray(parsed.models)) return null;
    return parsed;
  } catch (error) {
    console.warn('Failed to parse model cache', error);
    return null;
  }
};

const saveCachedModels = (providerId: string, models: OpenRouterModel[]) => {
  try {
    const entry: ModelCacheEntry = { timestamp: Date.now(), models };
    localStorage.setItem(getCacheKey(providerId), JSON.stringify(entry));
    return entry.timestamp;
  } catch (error) {
    console.warn('Failed to write model cache', error);
    return Date.now();
  }
};

interface GenerateStreamParams {
  agent: AgentConfig;
  provider: LLMProvider;
  prompt: string;
  conversationHistory?: any[]; // Full conversation history for context
  onChunk: (text: string) => void;
  onComplete?: (usage?: TokenUsage) => void; // Callback when streaming is complete with token usage
  signal?: AbortSignal;
}

// Check if we should use the proxy (no user API key configured)
export const shouldUseProxy = (provider: LLMProvider): boolean => {
  // Only use proxy for OpenRouter provider without API key
  const isOpenRouter =
    provider.baseURL?.includes('openrouter') || provider.id === 'provider-openrouter';
  return isOpenRouter && !provider.apiKey;
};

// Check proxy availability
export const checkProxyStatus = async (): Promise<{ available: boolean; message?: string }> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'test', messages: [] }),
    });

    if (response.status === 503) {
      const data = await response.json();
      if (data.code === 'NO_SERVER_KEY') {
        return { available: false, message: data.message };
      }
    }

    // Even a 400 error means the proxy is available (just invalid request)
    return { available: true };
  } catch {
    return { available: false, message: 'Proxy service unavailable' };
  }
};

export const validateOpenRouterKey = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.status === 401) {
      return false;
    }

    if (!response.ok) {
      // If it's a 402 or other error, we treat it as validation failure or throw specific error
      throw new Error(`Validation failed with status: ${response.status}`);
    }

    const data = await response.json();
    // OpenRouter auth/key returns { data: { label: "...", usage: ... } } if valid
    return !!data?.data;
  } catch (error) {
    console.error('Key validation error:', error);
    throw error;
  }
};

// Fetch OpenRouter models (public endpoint, no API key required)
export const fetchModelsViaProxy = async (
  ttlMs: number = DEFAULT_MODEL_CACHE_TTL,
  providerId = 'provider-openrouter'
): Promise<ModelFetchResult> => {
  const cached = loadCachedModels(providerId);
  const now = Date.now();

  if (cached && now - cached.timestamp < ttlMs) {
    return { models: cached.models, fromCache: true, offlineFallback: false, timestamp: cached.timestamp };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    console.log('Fetching OpenRouter models...');

    // OpenRouter 的模型列表是公开的，不需要 API Key
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch OpenRouter models: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Parse OpenRouter response format
    let models: OpenRouterModel[] = [];
    if (Array.isArray(data.data)) {
      models = data.data.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        created: m.created || 0,
        description: m.description,
        context_length: m.context_length || 0,
        max_completion_tokens: m.max_completion_tokens,
        pricing: m.pricing || {
          prompt: '0',
          completion: '0',
          image: '0',
          request: '0',
        },
        architecture: m.architecture,
        top_provider: m.top_provider,
        supported_parameters: m.supported_parameters,
      }));
    }

    const timestamp = saveCachedModels(providerId, models);
    return { models, fromCache: false, offlineFallback: false, timestamp };
  } catch (error) {
    console.error('Failed to fetch OpenRouter models:', error);
    if (cached) {
      return { models: cached.models, fromCache: true, offlineFallback: true, timestamp: cached.timestamp };
    }
    return { models: [], fromCache: false, offlineFallback: true, timestamp: now };
  }
};

// Fetch models from OpenRouter with full metadata
export const fetchProviderModels = async (
  provider: LLMProvider,
  ttlMs: number = DEFAULT_MODEL_CACHE_TTL
): Promise<ModelFetchResult> => {
  const cached = loadCachedModels(provider.id);
  const now = Date.now();

  if (cached && now - cached.timestamp < ttlMs) {
    return { models: cached.models, fromCache: true, offlineFallback: false, timestamp: cached.timestamp };
  }

  try {
    let baseUrl = provider.baseURL || 'https://api.openai.com/v1';

    // Clean URL logic to ensure we hit the /models endpoint correctly
    if (baseUrl.endsWith('/chat/completions')) {
      baseUrl = baseUrl.replace('/chat/completions', '');
    }
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // Append /models
    const modelsUrl = `${baseUrl}/models`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    // Fetch with timeout to prevent hanging on local offline servers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s for larger payloads

    console.log(`Fetching models from: ${modelsUrl}`);

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Handle different API response structures
    let models: OpenRouterModel[] = [];

    if (Array.isArray(data.data)) {
      // OpenRouter / OpenAI format - returns full model objects
      models = data.data.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        created: m.created || 0,
        description: m.description,
        context_length: m.context_length || 0,
        max_completion_tokens: m.max_completion_tokens,
        pricing: m.pricing || {
          prompt: '0',
          completion: '0',
          image: '0',
          request: '0',
        },
        architecture: m.architecture,
        top_provider: m.top_provider,
        supported_parameters: m.supported_parameters,
      }));
    } else if (Array.isArray(data.models)) {
      // Ollama specific - minimal metadata
      models = data.models.map((m: any) => ({
        id: m.name || m.model || m.id,
        name: m.name || m.model || m.id,
        created: 0,
        context_length: 0,
        pricing: {
          prompt: '0',
          completion: '0',
          image: '0',
          request: '0',
        },
      }));
    } else if (Array.isArray(data)) {
      // Rare edge case where root is array
      models = data.map((m: any) => ({
        id: m.id || m.name,
        name: m.name || m.id,
        created: m.created || 0,
        context_length: m.context_length || 0,
        pricing: m.pricing || {
          prompt: '0',
          completion: '0',
          image: '0',
          request: '0',
        },
      }));
    } else {
      console.warn('Unknown model list format', data);
      throw new Error('Invalid API response format: could not find model list');
    }

    // Filter out invalid models and sort by creation date (newest first)
    const normalizedModels = models
      .filter((m) => m.id && typeof m.id === 'string')
      .sort((a, b) => {
        // Primary sort: by created timestamp (newest first)
        const timeA = a.created || 0;
        const timeB = b.created || 0;
        if (timeB !== timeA) {
          return timeB - timeA; // Descending order (newest first)
        }
        // Secondary sort: by name (alphabetical)
        return a.name.localeCompare(b.name);
      });

    const timestamp = saveCachedModels(provider.id, normalizedModels);
    return { models: normalizedModels, fromCache: false, offlineFallback: false, timestamp };
  } catch (error) {
    console.error('Error fetching models:', error);
    if (cached) {
      return { models: cached.models, fromCache: true, offlineFallback: true, timestamp: cached.timestamp };
    }
    return { models: [], fromCache: false, offlineFallback: true, timestamp: now };
  }
};

export const generateContentStream = async ({
  agent,
  provider,
  prompt,
  conversationHistory,
  onChunk,
  onComplete,
  signal,
}: GenerateStreamParams): Promise<void> => {
  // 1. Handle Google GenAI Models
  if (provider.type === 'google') {
    const apiKey = provider.apiKey;

    if (!apiKey) {
      throw new Error('Google API Key is missing. Please set it in Settings > Providers.');
    }

    const ai = new GoogleGenAI({ apiKey });

    // Check if this is a thinking model
    const isThinkingModel = agent.modelId.toLowerCase().includes('thinking');

    // Build conversation history for Google API format
    let contents: any;
    if (conversationHistory && conversationHistory.length > 0) {
      // Format messages for Google API: array of {role, parts: [{text}]}
      contents = conversationHistory.map((msg) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
      // Add current prompt as last user message
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      // Debug: Log formatted contents
      console.log(
        '[Google API] Formatted conversation:',
        contents.map((c: any) => ({
          role: c.role,
          text: c.parts[0].text.substring(0, 50) + '...',
        }))
      );
    } else {
      // Fallback: just use the prompt
      console.log('[Google API] No history, using prompt only');
      contents = prompt;
    }

    try {
      const response = await ai.models.generateContentStream({
        model: agent.modelId,
        contents: contents,
        config: {
          systemInstruction: agent.systemPrompt,
          // Map Agent Config to Gemini Generation Config
          temperature: agent.config?.temperature,
          topP: agent.config?.topP,
          topK: agent.config?.topK,
          maxOutputTokens: agent.config?.maxOutputTokens,
          // Enable thinking for thinking models
          ...(isThinkingModel && {
            thinkingConfig: {
              includeThoughts: true,
            },
          }),
        },
      });

      let thoughtBuffer = '';
      let isCollectingThought = false;
      let capturedUsageMetadata: any = null; // Capture usage from chunks

      for await (const chunk of response) {
        if (signal?.aborted) {
          break;
        }

        // Capture usageMetadata from chunk if available
        if (chunk.usageMetadata) {
          capturedUsageMetadata = chunk.usageMetadata;
        }

        // Debug: Log chunk structure for thinking models
        if (isThinkingModel && chunk.candidates?.[0]?.content?.parts) {
          console.log(
            '[Gemini Thinking Debug] Chunk parts:',
            JSON.stringify(chunk.candidates[0].content.parts, null, 2)
          );
        }

        // Process thoughts if available (for thinking models)
        // Iterate through parts to check for thought content
        if (chunk.candidates?.[0]?.content?.parts) {
          for (const part of chunk.candidates[0].content.parts) {
            // Check if this part is a thought
            if (part.thought && part.text) {
              // Stream thought content in chunks for better UX
              const text = part.text;

              // If starting a new thought, open the tag
              if (!isCollectingThought) {
                onChunk('<think>');
                isCollectingThought = true;
              }

              // Stream the thought text in chunks (every ~20 chars)
              let buffer = thoughtBuffer + text;
              thoughtBuffer = '';

              const chunkSize = 20;
              while (buffer.length >= chunkSize) {
                onChunk(buffer.slice(0, chunkSize));
                buffer = buffer.slice(chunkSize);
              }
              thoughtBuffer = buffer;
            } else if (part.text && !part.thought) {
              // If we were collecting thoughts, close the think tag
              if (isCollectingThought) {
                // Send remaining thought buffer
                if (thoughtBuffer) {
                  onChunk(thoughtBuffer);
                  thoughtBuffer = '';
                }
                onChunk('</think>');
                isCollectingThought = false;
              }
              // Regular text content
              onChunk(part.text);
            }
          }
        } else {
          // Fallback to simple text extraction
          const text = chunk.text;
          if (text) {
            onChunk(text);
          }
        }
      }

      // Handle any remaining thought content at the end
      if (isCollectingThought) {
        if (thoughtBuffer) {
          onChunk(thoughtBuffer);
        }
        onChunk('</think>');
      }

      // Capture token usage from usageMetadata
      if (onComplete) {
        if (capturedUsageMetadata) {
          const usage: TokenUsage = {
            promptTokens: capturedUsageMetadata.promptTokenCount || 0,
            completionTokens: capturedUsageMetadata.candidatesTokenCount || 0,
            totalTokens: capturedUsageMetadata.totalTokenCount || 0,
          };
          onComplete(usage);
        } else {
          onComplete();
        }
      }
    } catch (error) {
      if (signal?.aborted) return; // Ignore abort errors for GenAI
      console.error('Gemini API Error:', error);
      throw error;
    }
    return;
  }

  // 2. Handle OpenAI Compatible Models (OpenRouter, LocalLLM, etc.)
  if (provider.type === 'openai-compatible') {
    const apiKey = provider.apiKey;
    const baseURL = provider.baseURL || 'https://api.openai.com/v1';

    // Check if we should use proxy (OpenRouter without API key)
    const useProxy = shouldUseProxy(provider);

    if (!apiKey && !useProxy) {
      // We allow empty key for localhost (Ollama usually doesn't need it).
      const isLocal =
        baseURL.includes('localhost') ||
        baseURL.includes('127.0.0.1') ||
        baseURL.includes('ollama');
      if (!isLocal) {
        throw new Error(`Missing API Key for provider: ${provider.name}`);
      }
    }

    // Use proxy URL or direct URL
    let url: string;
    let headers: Record<string, string>;

    if (useProxy) {
      // Use our Vercel serverless function as proxy
      url = '/api/chat';
      headers = {
        'Content-Type': 'application/json',
      };
    } else {
      // Direct connection
      url = baseURL;
      if (!url.endsWith('/chat/completions')) {
        url = `${url.replace(/\/$/, '')}/chat/completions`;
      }

      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey || 'nexus-chat'}`,
      };

      // OpenRouter specific recommended headers
      if (baseURL.includes('openrouter')) {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'NexusChat';
      }
    }

    // Check if this is a reasoning/thinking model
    const isReasoningModel =
      agent.modelId.toLowerCase().includes('r1') ||
      agent.modelId.toLowerCase().includes('reasoning') ||
      agent.modelId.toLowerCase().includes('thinking');

    try {
      // Build messages array with conversation history
      const messages: any[] = [{ role: 'system', content: agent.systemPrompt }];

      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach((msg) => {
          messages.push({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.content,
          });
        });
      }

      // Add current user prompt
      messages.push({ role: 'user', content: prompt });

      // Debug: Log OpenRouter messages
      console.log(
        '[OpenRouter API] Messages being sent:',
        messages.map((m) => ({
          role: m.role,
          content: m.content.substring(0, 50) + '...',
        }))
      );

      const requestBody: any = {
        model: agent.modelId,
        messages: messages,
        stream: true,
        // Inject Config
        temperature: agent.config?.temperature,
        top_p: agent.config?.topP,
        max_tokens: agent.config?.maxOutputTokens,
      };

      // Enable reasoning tokens for OpenRouter reasoning models
      if (baseURL.includes('openrouter') && isReasoningModel) {
        requestBody.include_reasoning = true;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        signal, // Pass the abort signal to fetch
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();

        // Try to parse error response for more details
        try {
          const errData = JSON.parse(errText);

          // Handle rate limit / quota exceeded from proxy
          if (errData.code === 'RATE_LIMIT_EXCEEDED') {
            throw new Error(`FREE_TIER_LIMIT: ${errData.message}`);
          }

          // Handle server configuration error
          if (errData.code === 'NO_SERVER_KEY') {
            throw new Error(`NO_FREE_TIER: ${errData.message}`);
          }
        } catch (parseErr) {
          // If not JSON, use raw text
          if (!(parseErr instanceof SyntaxError)) throw parseErr;
        }

        throw new Error(`API Error (${provider.name} - ${response.status}): ${errText}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isInReasoningBlock = false; // Track if we're currently in a reasoning block
      let capturedUsage: TokenUsage | undefined; // Capture usage from SSE

      while (true) {
        if (signal?.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) {
          // Close reasoning block if still open
          if (isInReasoningBlock) {
            onChunk('</think>');
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last partial line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6); // Remove "data: "
          if (data === '[DONE]') {
            // Close reasoning block if still open
            if (isInReasoningBlock) {
              onChunk('</think>');
              isInReasoningBlock = false;
            }
            continue;
          }

          try {
            const json = JSON.parse(data);

            // Capture token usage if available (usually in the last message)
            if (json.usage) {
              capturedUsage = {
                promptTokens: json.usage.prompt_tokens || 0,
                completionTokens: json.usage.completion_tokens || 0,
                totalTokens: json.usage.total_tokens || 0,
              };
            }

            const delta = json.choices?.[0]?.delta;

            if (!delta) continue;

            // Priority 1: Check for explicit reasoning field (OpenRouter format)
            const reasoning = delta.reasoning || delta.reasoning_content;
            if (reasoning) {
              // Open the thinking block on first reasoning chunk
              if (!isInReasoningBlock) {
                onChunk('<think>');
                isInReasoningBlock = true;
              }
              // Stream the reasoning content directly (already in the block)
              onChunk(reasoning);
            }

            // Priority 2: Regular content (might already contain <think> tags for DeepSeek)
            const content = delta.content;
            if (content) {
              // Close reasoning block before outputting content
              if (isInReasoningBlock) {
                onChunk('</think>');
                isInReasoningBlock = false;
              }
              onChunk(content);
            }
          } catch {
            // Ignore parse errors for malformed SSE messages
          }
        }
      }

      // Call onComplete with captured usage data
      if (onComplete) {
        onComplete(capturedUsage);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('OpenAI Compatible API Error:', error);
      throw error;
    }
    return;
  }

  throw new Error(`Unsupported provider type: ${provider.type}`);
};
