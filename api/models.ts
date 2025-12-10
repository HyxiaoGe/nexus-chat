/**
 * Vercel Serverless Function - Models Proxy
 *
 * This function proxies model list requests to OpenRouter API
 * using the server's API key, allowing users to see available models
 * without configuring their own API key.
 */

export const config = {
  runtime: 'edge',
};

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

export default async function handler(request: Request): Promise<Response> {
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get API key from environment variable
  // @ts-expect-error - process.env is available in Vercel Edge Runtime
  const apiKey = process.env.OPENROUTER_API_KEY as string | undefined;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'Server configuration error',
        message: 'Model list service is currently unavailable.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Fetch models from OpenRouter
    const response = await fetch(OPENROUTER_MODELS_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': request.headers.get('origin') || 'https://nexus-chat.vercel.app',
        'X-Title': 'NexusChat',
      },
    });

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

    // Return the models list
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error: unknown) {
    console.error('Models proxy error:', error);
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
