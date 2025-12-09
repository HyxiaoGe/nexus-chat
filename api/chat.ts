/**
 * Vercel Serverless Function - Chat Proxy
 *
 * This function acts as a secure proxy to OpenRouter API.
 * It uses a shared API key stored in environment variables,
 * allowing users without their own API key to use the service.
 */

export const config = {
  runtime: 'edge',
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export default async function handler(request: Request): Promise<Response> {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get API key from environment variable (Vercel Edge Runtime)
  // @ts-expect-error - process.env is available in Vercel Edge Runtime
  const apiKey = process.env.OPENROUTER_API_KEY as string | undefined;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'Server configuration error',
        message: 'Free tier is currently unavailable. Please configure your own API key.',
        code: 'NO_SERVER_KEY',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.model || !body.messages) {
      return new Response(JSON.stringify({ error: 'Missing required fields: model, messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Forward request to OpenRouter
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': request.headers.get('origin') || 'https://nexus-chat.vercel.app',
        'X-Title': 'NexusChat',
      },
      body: JSON.stringify({
        model: body.model,
        messages: body.messages,
        stream: body.stream ?? true,
        temperature: body.temperature,
        top_p: body.top_p,
        max_tokens: body.max_tokens,
        include_reasoning: body.include_reasoning,
      }),
    });

    // Handle rate limit / quota exceeded errors
    if (response.status === 402 || response.status === 429) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message:
            'Free tier daily limit reached. Please try again tomorrow or configure your own API key for unlimited access.',
          code: 'RATE_LIMIT_EXCEEDED',
          details: errorData,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle other errors from OpenRouter
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: 'API Error',
          message: errorText,
          status: response.status,
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // For streaming responses, pipe the response
    if (body.stream) {
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // For non-streaming, return JSON
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Proxy error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
