
# NexusChat - Multi-LLM Orchestrator

[![中文文档](https://img.shields.io/badge/文档-中文版-blue)](./README.zh-CN.md)

**NexusChat** is a professional, multi-agent chat interface that allows you to converse with multiple Large Language Models (LLMs) simultaneously. It mimics the user experience of Telegram/WhatsApp but assigns a unique "Persona" (Agent) to different AI models, allowing for parallel generation, comparing outputs, and orchestrated reasoning.

![NexusChat Interface](https://placehold.co/1200x600/1a202c/ffffff?text=NexusChat+Interface+Preview)

## ✨ Features

*   **Multi-Agent System**: Trigger unlimited LLMs with a single user prompt.
*   **Unified Interface**: Agents respond in a chat bubble stream, similar to a group chat.
*   **Provider Agnostic**:
    *   **Google Gemini**: Native support for Gemini 1.5 Pro/Flash and 2.0.
    *   **OpenAI Compatible**: Support for **DeepSeek**, **Claude**, **Llama**, and **GPT-4** via OpenRouter or local endpoints (Ollama/LM Studio).
*   **Real-time Streaming**: Smooth, typewriter-style text generation.
*   **Internationalization (i18n)**: Full English and Chinese (中文) support.
*   **Theming**: Built-in Light and Dark modes.
*   **Data Management**: LocalStorage persistence with Export/Import capabilities.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+) or a modern web browser supporting ES Modules.
*   API Keys for [Google Gemini](https://aistudio.google.com/) or [OpenRouter](https://openrouter.ai/).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/nexus-chat.git
    cd nexus-chat
    ```

2.  Install dependencies (if using a local bundler like Vite):
    ```bash
    npm install
    ```

3.  Configure Environment:
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and add your default API keys (Optional, keys can also be set in the UI).

4.  Run the app:
    ```bash
    npm run dev
    ```

## 🛠 Configuration

### Managing Agents
1.  Click **Settings** (Gear Icon).
2.  Go to **My Agents**.
3.  Create a new agent (e.g., "Coding Expert").
4.  Select a **Provider** (Google or OpenRouter).
5.  Select a **Model ID** (e.g., `deepseek/deepseek-r1`).
6.  Set a **System Prompt** to define the persona.

### Adding Providers
NexusChat supports connecting to custom OpenAI-compatible endpoints.
1.  Go to **Settings > Providers**.
2.  Add **Custom Provider**.
3.  Set Base URL (e.g., `http://localhost:11434/v1` for Ollama).
4.  Enter API Key (if required).

## 📦 Deployment

This project is optimized for Vercel deployment as a Single Page Application (SPA).

1.  Push to GitHub.
2.  Import project into Vercel.
3.  Vercel will automatically detect the framework settings.
4.  (Optional) Add `API_KEY` to Vercel Environment Variables.

## 📄 License

MIT License.
