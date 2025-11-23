
import { GoogleGenAI } from "@google/genai";
import { AgentConfig, LLMProvider, OpenRouterModel } from "../types";

interface GenerateStreamParams {
  agent: AgentConfig;
  provider: LLMProvider;
  prompt: string;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

export const validateOpenRouterKey = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
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
    console.error("Key validation error:", error);
    throw error;
  }
};

// Fetch models from OpenRouter with full metadata
export const fetchProviderModels = async (provider: LLMProvider): Promise<OpenRouterModel[]> => {
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
        'Content-Type': 'application/json'
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
        signal: controller.signal
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
            request: '0'
          },
          architecture: m.architecture,
          top_provider: m.top_provider,
          supported_parameters: m.supported_parameters
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
            request: '0'
          }
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
            request: '0'
          }
        }));
    } else {
        console.warn("Unknown model list format", data);
        throw new Error("Invalid API response format: could not find model list");
    }

    // Filter out invalid models and sort by name
    return models.filter(m => m.id && typeof m.id === 'string').sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
};

export const generateContentStream = async ({
  agent,
  provider,
  prompt,
  onChunk,
  signal
}: GenerateStreamParams): Promise<void> => {
  
  // 1. Handle Google GenAI Models
  if (provider.type === 'google') {
    const apiKey = provider.apiKey;

    if (!apiKey) {
        throw new Error("Google API Key is missing. Please set it in Settings > Providers.");
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContentStream({
        model: agent.modelId,
        contents: prompt,
        config: {
          systemInstruction: agent.systemPrompt,
          // Map Agent Config to Gemini Generation Config
          temperature: agent.config?.temperature,
          topP: agent.config?.topP,
          topK: agent.config?.topK,
          maxOutputTokens: agent.config?.maxOutputTokens
        }
      });

      for await (const chunk of response) {
        if (signal?.aborted) {
            break;
        }
        const text = chunk.text;
        if (text) {
          onChunk(text);
        }
      }
    } catch (error) {
      if (signal?.aborted) return; // Ignore abort errors for GenAI
      console.error("Gemini API Error:", error);
      throw error;
    }
    return;
  }

  // 2. Handle OpenAI Compatible Models (OpenRouter, LocalLLM, etc.)
  if (provider.type === 'openai-compatible') {
    const apiKey = provider.apiKey;
    const baseURL = provider.baseURL || 'https://api.openai.com/v1';

    if (!apiKey) {
       // We allow empty key for localhost (Ollama usually doesn't need it).
       const isLocal = baseURL.includes('localhost') || baseURL.includes('127.0.0.1') || baseURL.includes('ollama');
       if (!isLocal) {
          throw new Error(`Missing API Key for provider: ${provider.name}`);
       }
    }

    // Ensure URL ends with /chat/completions if not present
    let url = baseURL;
    if (!url.endsWith('/chat/completions')) {
        url = `${url.replace(/\/$/, '')}/chat/completions`;
    }

    // Standard headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey || 'nexus-chat'}`,
    };
    
    // OpenRouter specific recommended headers
    if (baseURL.includes('openrouter')) {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'NexusChat';
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            signal, // Pass the abort signal to fetch
            body: JSON.stringify({
                model: agent.modelId,
                messages: [
                    { role: 'system', content: agent.systemPrompt },
                    { role: 'user', content: prompt }
                ],
                stream: true,
                // Inject Config
                temperature: agent.config?.temperature,
                top_p: agent.config?.topP,
                max_tokens: agent.config?.maxOutputTokens
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error (${provider.name} - ${response.status}): ${errText}`);
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            if (signal?.aborted) {
                reader.cancel();
                break;
            }

            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last partial line

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                
                const data = trimmed.slice(6); // Remove "data: "
                if (data === '[DONE]') continue;

                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content;
                    
                    if (content) {
                        onChunk(content);
                    }
                    
                    // Handle DeepSeek R1 reasoning content if present (OpenRouter often passes this through)
                    const reasoning = json.choices?.[0]?.delta?.reasoning_content;
                    if (reasoning) {
                         onChunk(`<think>${reasoning}</think>`);
                    }
                } catch (e) {
                    // console.warn("Failed to parse SSE message", e);
                }
            }
        }

    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error("OpenAI Compatible API Error:", error);
        throw error;
    }
    return;
  }

  throw new Error(`Unsupported provider type: ${provider.type}`);
};
