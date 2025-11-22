import { GoogleGenAI } from "@google/genai";
import { AgentConfig, LLMProvider } from "../types";

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

// Generalized function to fetch models from any OpenAI-compatible endpoint
export const fetchProviderModels = async (provider: LLMProvider): Promise<string[]> => {
  try {
    let baseUrl = provider.baseURL || 'https://api.openai.com/v1';
    
    // Clean URL logic to ensure we hit the /models endpoint correctly
    // If user provided "http://localhost:11434", we want "http://localhost:11434/v1/models"
    // If user provided "http://localhost:11434/v1", we want "http://localhost:11434/v1/models"
    
    if (baseUrl.endsWith('/chat/completions')) {
        baseUrl = baseUrl.replace('/chat/completions', '');
    }
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }
    
    // Heuristic: if URL doesn't end in /v1 and isn't openrouter, append /v1 for standard openai compat
    // But strictly speaking, we should trust the user's base URL. 
    // We will append /models.
    const modelsUrl = `${baseUrl}/models`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (provider.apiKey) {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    // Fetch with timeout to prevent hanging on local offline servers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

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
    // Standard OpenAI: { data: [{ id: '...' }, ...] }
    // Ollama: { models: [{ name: '...' }, ...] } (sometimes) or { data: ... }
    
    let models: string[] = [];

    if (Array.isArray(data.data)) {
        models = data.data.map((m: any) => m.id);
    } else if (Array.isArray(data.models)) {
        // Ollama specific
        models = data.models.map((m: any) => m.name || m.model || m.id);
    } else if (Array.isArray(data)) {
        // Rare edge case where root is array
        models = data.map((m: any) => m.id || m.name);
    } else {
        console.warn("Unknown model list format", data);
        throw new Error("Invalid API response format: could not find model list");
    }

    // Filter out weird empty strings if any
    return models.filter(m => m && typeof m === 'string').sort();
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
    // Fixed: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const response = await ai.models.generateContentStream({
        model: agent.modelId,
        contents: prompt,
        config: {
          systemInstruction: agent.systemPrompt,
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
       // Some local endpoints might not need a key, but usually they do.
       // We allow empty key for localhost (Ollama usually doesn't need it).
       const isLocal = baseURL.includes('localhost') || baseURL.includes('127.0.0.1') || baseURL.includes('ollama');
       if (!isLocal) {
          throw new Error(`Missing API Key for provider: ${provider.name}`);
       }
    }

    // Ensure URL ends with /chat/completions if not present
    let url = baseURL;
    if (!url.endsWith('/chat/completions')) {
        // Handle potential double slash issues or missing path
        url = `${url.replace(/\/$/, '')}/chat/completions`;
    }

    // Standard headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey || 'nexus-chat'}`, // Some servers expect non-empty auth
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

    } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error("OpenAI Compatible API Error:", error);
        throw error;
    }
    return;
  }

  throw new Error(`Unsupported provider type: ${provider.type}`);
};