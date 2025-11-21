
import { GoogleGenAI } from "@google/genai";
import { AgentConfig, LLMProvider } from "../types";

// Default env key for Gemini. 
const ENV_API_KEY = process.env.API_KEY || '';

interface GenerateStreamParams {
  agent: AgentConfig;
  provider: LLMProvider;
  prompt: string;
  onChunk: (text: string) => void;
}

export const fetchOpenRouterModels = async (apiKey: string): Promise<string[]> => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    // OpenRouter returns { data: [ { id: '...' }, ... ] }
    return data.data.map((m: any) => m.id).sort();
  } catch (error) {
    console.error("Error fetching OpenRouter models:", error);
    return [];
  }
};

export const generateContentStream = async ({
  agent,
  provider,
  prompt,
  onChunk
}: GenerateStreamParams): Promise<void> => {
  
  // 1. Handle Google GenAI Models
  if (provider.type === 'google') {
    // Use the provided key if available, otherwise fall back to env
    const apiKey = provider.apiKey || ENV_API_KEY;
    
    if (!apiKey) {
        throw new Error(`No API Key configured for ${provider.name}. Please check Settings > Providers.`);
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContentStream({
        model: agent.modelId,
        contents: prompt,
        config: {
          systemInstruction: agent.systemPrompt,
        }
      });

      for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
          onChunk(text);
        }
      }
    } catch (error) {
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
       // Some local endpoints might not need a key, but usually they do
       if (!baseURL.includes('localhost') && !baseURL.includes('127.0.0.1') && !baseURL.includes('ollama')) {
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
        'Authorization': `Bearer ${apiKey}`,
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
                         onChunk(`\n\n> *Thinking Process:* ${reasoning}\n\n`);
                    }
                } catch (e) {
                    // console.warn("Failed to parse SSE message", e);
                }
            }
        }

    } catch (error) {
        console.error("OpenAI Compatible API Error:", error);
        throw error;
    }
    return;
  }

  throw new Error(`Unsupported provider type: ${provider.type}`);
};
