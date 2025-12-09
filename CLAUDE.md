# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NexusChat is a multi-LLM chat orchestrator that enables users to converse with multiple AI models simultaneously. It's a React + TypeScript Vite app with no backend - all data is stored in browser localStorage. The app supports both user-provided API keys and a free tier via a Vercel Edge Function proxy.

## Development Commands

### Build and Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on port 3000
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build locally
```

### Type Checking

```bash
npm run build        # Includes TypeScript compilation (tsc)
npx tsc --noEmit     # Type check without building
```

Note: This project does NOT have ESLint or testing frameworks configured. Type checking is done via `tsc` as part of the build process.

## Architecture

### Core Design Principles

1. **No Backend Architecture**: All state lives in `localStorage`. No server-side database or authentication.
2. **Multi-Agent Chat**: Multiple AI agents respond to each user message in parallel, with individual start/stop controls.
3. **Provider Abstraction**: Supports Google Gemini (native SDK) and OpenAI-compatible APIs (OpenRouter, Ollama, LM Studio, etc.)
4. **Free Tier via Proxy**: Users without API keys can use a Vercel Edge Function (`/api/chat.ts`) that proxies requests to OpenRouter using a shared server-side API key.

### Key Architectural Components

#### 1. State Management (App.tsx)

- **Root component** manages all global state via React hooks
- No Redux/Zustand - uses `useState` for sessions, messages, agents, providers, settings
- State is persisted to `localStorage` on every change via `STORAGE_KEYS` constants
- Language/theme settings managed through `AppSettings` and synced with i18next

#### 2. Chat Orchestration (hooks/useChatOrchestrator.ts)

- **Core hook** for multi-agent chat logic
- Manages parallel streaming from multiple agents simultaneously
- Maintains `AbortController` map for individual agent cancellation
- Handles token usage tracking and cost calculation
- Updates both per-message and per-session token statistics

#### 3. API Service Layer (services/geminiService.ts)

- **Single service file** handles ALL provider integrations:
  - Google Gemini: Uses `@google/genai` SDK directly
  - OpenAI-compatible: Uses fetch with SSE streaming
  - Free Tier Proxy: Routes requests to `/api/chat` when no API key present
- `generateContentStream()`: Main function that orchestrates streaming based on provider type
- `shouldUseProxy()`: Determines if request should go through Vercel proxy
- `fetchProviderModels()`: Dynamically loads model lists from providers (especially OpenRouter)

#### 4. Component Structure

```
components/
  ├── AgentColumn.tsx           # Individual agent chat column in grid layout
  ├── MessageBubble.tsx         # Message display with markdown, code highlighting, thinking tags
  ├── SmartContentRenderer.tsx  # Handles markdown, code blocks, <think> tags for reasoning models
  ├── ModelSettings.tsx         # Large settings dialog (agents, providers, general, data management)
  ├── WelcomeDialog.tsx         # First-time user onboarding (free tier vs. API key)
  ├── Sidebar.tsx               # Session management sidebar
  ├── FullscreenAgentView.tsx   # Modal for viewing single agent's full conversation
  ├── ResponsiveGrid.tsx        # Responsive layout for agent columns (1-4 columns)
  └── BrandIcons.tsx            # Brand icon mapping using @lobehub/icons
```

#### 5. Data Model (types.ts)

- **AgentConfig**: Agent definition (name, avatar, providerId, modelId, systemPrompt, config)
- **LLMProvider**: API provider settings (baseURL, apiKey, type, fetchedModels cache)
- **Message**: Chat message with role, content, timestamp, agentId, tokenUsage, streaming state
- **Session**: Conversation session with title, timestamps, sessionTokenUsage
- **TokenUsage**: Token count and cost tracking per message

#### 6. Constants and Defaults (constants.ts)

- `DEFAULT_AGENTS`: Pre-configured agents (Claude, GPT, Gemini, DeepSeek, etc.)
- `DEFAULT_PROVIDERS`: OpenRouter as default provider
- `BRAND_CONFIGS`: Maps model vendors to brand icons
- `getBrandFromModelId()`: Extracts brand from model ID (e.g., "anthropic/claude-3.5" → "anthropic")
- `isThinkingModel()`: Identifies reasoning models (DeepSeek R1, OpenAI o1/o3)
- `STORAGE_KEYS`: localStorage key constants

### Data Flow for Chat Messages

1. User types message in App.tsx → `handleSendMessage()`
2. Creates user message, updates state, saves to localStorage
3. Calls `sendMessage()` from `useChatOrchestrator`
4. For each enabled agent:
   - Creates empty model message with `isStreaming: true`
   - Calls `generateContentStream()` from geminiService
   - Service determines provider type (Gemini SDK vs OpenAI-compatible vs Proxy)
   - Streams chunks via `onChunk` callback
   - Updates message state incrementally
   - On completion, updates token usage and marks `isStreaming: false`
5. AbortController stored per message ID for individual stop controls

### Free Tier Implementation

- **Frontend Check**: `shouldUseProxy(provider)` returns true if OpenRouter provider has no API key
- **Proxy Endpoint**: `/api/chat.ts` is a Vercel Edge Function that:
  - Reads `OPENROUTER_API_KEY` from environment (NOT exposed to client)
  - Forwards chat requests to OpenRouter API
  - Streams responses back to client
  - Handles rate limiting (returns 429 with helpful message)
- **Error Handling**: App detects proxy errors and prompts user to configure API key

### Token Usage & Cost Tracking

- **OpenRouter Models**: Pricing fetched from OpenRouter API (`/models` endpoint) and cached in provider
- **Per-Message Tracking**: Each message stores `tokenUsage` with prompt/completion tokens + cost
- **Session Tracking**: Cumulative token count and cost for current session
- **Global Stats**: `TokenStats` in localStorage tracks lifetime usage per model

### Internationalization (i18n)

- Uses `i18next` with `react-i18next`
- Translations defined in `locales.ts` (inline JSON, not separate files)
- Supports English (en) and Simplified Chinese (zh)
- Auto-detects browser language on first load
- Language setting persisted in `AppSettings`

### Reasoning Model Support

- Models like DeepSeek R1 and OpenAI o1 output thinking process in `<think>` tags
- `SmartContentRenderer.tsx` detects and renders thinking content with collapsible UI
- `isThinkingModel()` helper identifies these models
- System prompts for reasoning models explicitly request `<think>` tag usage

## Important Implementation Notes

### Adding New Providers

1. Add provider to `providers` state (or edit existing in ModelSettings)
2. For OpenAI-compatible APIs, specify `baseURL` (e.g., `http://localhost:11434/v1` for Ollama)
3. Service layer automatically handles OpenAI-compatible streaming via fetch + SSE
4. For non-OpenAI APIs, extend `generateContentStream()` in geminiService.ts

### Adding New Agents

1. Agents are just configs - no code needed
2. Create `AgentConfig` with providerId reference
3. Agent state stored in `agents` array and persisted to localStorage
4. Max 4 agents can be enabled simultaneously (UI enforced)

### Model Selection

- OpenRouter models are dynamically fetched and cached in `LLMProvider.fetchedModels`
- Cache invalidated after 24 hours (check `lastFetched` timestamp)
- Fallback to `suggestedModels` if fetch fails
- Model IDs follow OpenRouter format: `vendor/model-name` (e.g., `anthropic/claude-opus-4.5`)

### localStorage Schema

```
nexus_sessions: Session[]
nexus_messages: Message[]
nexus_providers: LLMProvider[]
nexus_agents: AgentConfig[]
nexus_settings: AppSettings
nexus_token_stats: TokenStats
```

### Version Checking

- `useVersionCheck.ts` polls `/version.json` every 5 minutes
- Compares `__APP_VERSION__` (injected at build time) with server version
- Shows toast notification when new version detected
- `vite.config.ts` generates `version.json` during build

## Deployment

### Vercel (Primary)

1. Push to GitHub
2. Import to Vercel (auto-detects Vite config)
3. Add environment variable `OPENROUTER_API_KEY` for free tier support
4. Optional: `VITE_GOOGLE_API_KEY` for default Gemini key
5. `vercel.json` handles routing (API proxy + SPA fallback)

### Local Environment Variables

- `.env.example` is empty (no required env vars)
- Optional: `VITE_GOOGLE_API_KEY`, `VITE_OPENROUTER_API_KEY`
- These provide default API keys baked into the build (NOT recommended for production)

## Common Development Tasks

### Debugging SSE Streaming Issues

- Check Network tab for `text/event-stream` responses
- Verify `data:` prefix in SSE chunks
- Ensure AbortSignal is passed to fetch for cancellation support
- Check provider baseURL ends with `/chat/completions` (auto-fixed in service layer)

### Debugging Proxy Errors

- Proxy returns 503 with `NO_SERVER_KEY` if `OPENROUTER_API_KEY` not set
- Returns 429 with `RATE_LIMIT_EXCEEDED` if daily quota exceeded
- Frontend should gracefully handle these and prompt user to add API key

### Adding New Brand Icons

1. Update `BRAND_CONFIGS` in constants.ts
2. Add icon mapping in `BrandIcons.tsx` using `@lobehub/icons`
3. Extend `getBrandFromModelId()` logic to recognize new vendor

### Testing Provider Connections

- ModelSettings has "Save & Verify" button that calls `fetchProviderModels()`
- For OpenRouter: validates API key via `/auth/key` endpoint
- For others: attempts to fetch `/models` endpoint
- Local providers (Ollama) may not have `/models` endpoint - this is expected

## File Organization Notes

- **Flat structure**: All TS/TSX files at root level (no `src/` directory)
- **Co-location**: Components, hooks, services, utils in separate top-level folders
- **api/**: Vercel serverless functions (Edge Runtime)
- **docs/**: Screenshots and documentation assets
- **No tests**: Project currently has no test suite

## Tech Stack Reference

- **React 18.2** with Hooks (no class components)
- **TypeScript 5.0+** for type safety
- **Vite 5.x** for build and dev server
- **Tailwind CSS 3.x** for styling (utility-first)
- **@google/genai** for Gemini integration
- **@lobehub/icons** for AI brand logos
- **lucide-react** for UI icons
- **i18next** for internationalization

## Caveats and Known Issues

- **API Keys in localStorage**: Keys stored unencrypted - warn users about security
- **No Authentication**: Anyone with local access can view stored API keys
- **No Server-Side Sessions**: Browser data can be lost if localStorage cleared
- **Limited Error Recovery**: Network errors during streaming may leave messages in incomplete state
- **Free Tier Limits**: Shared quota may be exhausted quickly with many users
