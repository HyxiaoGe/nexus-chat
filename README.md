<div align="center">

# 🌐 NexusChat

### Multi-LLM Chat Orchestrator | Unified AI Conversation Platform

[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](https://github.com/HyxiaoGe/nexus-chat)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/HyxiaoGe/nexus-chat/pulls)

[English](./README.md) | [简体中文](./README.zh-CN.md)

**Chat with multiple AI models simultaneously in a unified, elegant interface.**

🎉 **New: Try instantly with Free Tier - No API key required!**

[✨ Features](#-features) • [🚀 Quick Start](#-quick-start) • [📸 Screenshots](#-screenshots) • [🛠️ Tech Stack](#️-tech-stack) • [📖 Documentation](#-documentation)

</div>

---

## 🌟 What is NexusChat?

**NexusChat** is a powerful, open-source multi-agent chat orchestrator that enables you to **converse with multiple Large Language Models (LLMs) simultaneously**. Inspired by modern messaging apps like Telegram and WhatsApp, NexusChat provides a seamless group-chat experience where each AI model acts as a unique "agent" with its own personality and capabilities.

### 🎯 Why NexusChat?

- **🆓 Free Tier Available**: Start chatting immediately - no API key required (daily limit applies)
- **🔄 Compare AI Responses**: Get diverse perspectives from GPT-4, Claude, Gemini, and DeepSeek in one conversation
- **💰 Cost Tracking**: Real-time token usage statistics and cost estimation for each model
- **🎨 Beautiful UI**: Modern, responsive design with light/dark themes and smooth animations
- **🌍 Universal Compatibility**: Support for OpenRouter, Google Gemini, OpenAI, and local models (Ollama/LM Studio)
- **🔒 Privacy First**: All data stored locally in your browser - no server required
- **⚡ Real-time Streaming**: Experience natural, typewriter-style responses with SSE streaming

---

## ✨ Features

### 🤖 Multi-Agent System
- **Unlimited Agents**: Create and manage multiple AI agents with custom personalities
- **Parallel Generation**: All agents respond simultaneously to your prompts
- **Agent-Specific Regeneration**: Regenerate responses for individual agents without affecting others
- **Individual Stop Controls**: Stop specific agents mid-generation while others continue

### 💬 Advanced Chat Experience
- **Real-time Streaming**: Smooth, typewriter-style text generation with Server-Sent Events (SSE)
- **Smart Content Rendering**:
  - Syntax-highlighted code blocks with language detection
  - Markdown support (tables, lists, formatting)
  - Thinking process visualization for reasoning models (DeepSeek R1, o1)
  - Auto-collapse for long messages with gradient fade overlay
- **Message Management**: Edit user messages, regenerate AI responses, copy/export conversations
- **Session History**: Automatic session grouping (Today, Yesterday, This Week, Older)

### 📊 Token Analytics & Cost Tracking
- **Per-Message Statistics**: Token count and estimated cost for each AI response
- **Session-Level Tracking**: Cumulative token usage and cost for current conversation
- **Global Statistics**: Total usage by model in Settings dashboard
- **OpenRouter Pricing**: Real-time cost calculation based on official pricing API

### 🎨 User Experience
- **Internationalization (i18n)**: Full support for English and Simplified Chinese
- **Theme Support**: Light and Dark modes with smooth transitions
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Keyboard Shortcuts**: Enter to send (configurable to Ctrl/Cmd+Enter)
- **Auto-scroll**: Smart scroll-to-bottom with manual scroll detection

### 🔧 Provider Integration
- **Google Gemini**: Native SDK integration for Gemini 1.5/2.0 models
- **OpenRouter**: Access to 100+ models including GPT-4, Claude, Llama, DeepSeek
- **OpenAI Compatible**: Connect to any OpenAI-compatible endpoint
- **Local Models**: Support for Ollama, LM Studio, and other local inference servers
- **Dynamic Model Loading**: Automatic model list synchronization from providers

### 💾 Data Management
- **Local Storage**: All data stored in browser localStorage (no server required)
- **Export/Import**: Backup and restore your entire chat history and settings
- **Session Management**: Create, delete, and organize conversation sessions
- **Provider Persistence**: Securely store API keys locally (with security warnings)

---

## 📸 Screenshots

<div align="center">

### 💬 Multi-Agent Chat Interface
![Multi-Agent Chat](https://via.placeholder.com/1200x700/1a202c/ffffff?text=Multi-Agent+Chat+Interface)

### 📊 Token Usage Statistics
![Token Statistics](https://via.placeholder.com/1200x700/1a202c/ffffff?text=Token+Usage+%26+Cost+Tracking)

### ⚙️ Agent Configuration
![Agent Settings](https://via.placeholder.com/1200x700/1a202c/ffffff?text=Agent+Configuration+Panel)

### 🌓 Dark Mode
![Dark Mode](https://via.placeholder.com/1200x700/0f172a/ffffff?text=Beautiful+Dark+Mode)

</div>

---

## 🚀 Quick Start

### Option 1: Try Online (Recommended)

Visit the live demo and start chatting immediately with the **Free Tier** - no setup required!

> 🎁 **Free Tier**: Daily limit applies. For unlimited access, configure your own [OpenRouter API key](https://openrouter.ai/settings/keys).

### Option 2: Self-Host

#### Prerequisites

- **Node.js** v18.0 or higher
- **npm** or **yarn** package manager
- (Optional) API keys for providers:
  - [Google AI Studio](https://aistudio.google.com/) (Gemini)
  - [OpenRouter](https://openrouter.ai/) (GPT-4, Claude, DeepSeek, etc.)

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HyxiaoGe/nexus-chat.git
   cd nexus-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment (Optional)**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to add default API keys:
   ```env
   VITE_GOOGLE_API_KEY=your_gemini_api_key
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open browser**
   Navigate to `http://localhost:5173`

### First-Time Setup

**Using Free Tier (No API Key):**
1. Open the app - you'll see the Welcome dialog
2. Click **"Start with Free Tier"** to begin immediately
3. Start chatting! All enabled agents will respond using the shared free quota

**Using Your Own API Key (Unlimited):**
1. Click the **Settings** icon (⚙️) in the top-right corner
2. Go to **Providers** tab
3. Click on **OpenRouter** and follow the guide to get your API key from [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)
4. Paste your API key and click **"Save"**
5. Enjoy unlimited access to 100+ AI models!

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2** - Modern React with Hooks
- **TypeScript 5.0** - Type-safe development
- **Vite 5.x** - Lightning-fast build tool
- **Tailwind CSS 3.x** - Utility-first CSS framework

### State Management
- **React Hooks** - useState, useEffect, useRef, useMemo
- **Custom Hooks** - Modular logic for chat orchestration, scroll management
- **LocalStorage API** - Client-side data persistence

### AI Integration
- **@google/genai** - Official Google Generative AI SDK
- **OpenRouter API** - Multi-model aggregation API
- **Server-Sent Events (SSE)** - Real-time streaming responses

### UI/UX
- **i18next** - Internationalization framework
- **Lucide React** - Beautiful icon library
- **@lobehub/icons** - Brand icons for AI models
- **React Markdown** - Markdown rendering
- **Syntax Highlighting** - Code block formatting

### Developer Tools
- **ESLint** - Code linting
- **TypeScript Compiler** - Type checking
- **Vite Build** - Production optimization

---

## 📖 Documentation

### Configuration Guide

#### Managing Agents

1. **Create an Agent**
   - Go to Settings → My Agents
   - Click "Create New Agent"
   - Configure:
     - **Name**: Display name for the agent
     - **Avatar**: Brand icon or custom image URL
     - **Provider**: Select API provider
     - **Model ID**: Choose or manually enter model
     - **System Prompt**: Define agent behavior and personality
     - **Advanced Settings**: Temperature, Top-P, Max Tokens

2. **Enable/Disable Agents**
   - Toggle the switch on agent cards
   - Maximum 4 agents can be active simultaneously

3. **Edit or Delete**
   - Click the pencil icon to edit
   - Click the trash icon to delete (with confirmation)

#### Adding Custom Providers

NexusChat supports any OpenAI-compatible API endpoint:

1. Go to Settings → Providers
2. Click "Add Custom Provider"
3. Configure:
   - **Name**: Provider display name
   - **Base URL**: API endpoint (e.g., `http://localhost:11434/v1` for Ollama)
   - **API Key**: Authentication key (if required)
4. Click "Save & Verify" to test connection

**Example Configurations:**
- **Ollama**: `http://localhost:11434/v1`
- **LM Studio**: `http://localhost:1234/v1`
- **Local vLLM**: `http://localhost:8000/v1`

#### Token Statistics

- **Per-Message**: Hover over the token count in each AI response to see details
- **Session Total**: View cumulative tokens and cost in the top header
- **Global Stats**: Check total usage per model in Settings → My Agents
- **Cost Calculation**: Automatically calculated using OpenRouter pricing data

### Keyboard Shortcuts

- **Enter**: Send message (configurable in Settings)
- **Shift + Enter**: New line in input
- **Ctrl/Cmd + Enter**: Send message (when Enter-to-send is disabled)

### Data Privacy

⚠️ **Important Security Notes:**
- API keys are stored **unencrypted** in browser `localStorage`
- Only use NexusChat on **trusted devices**
- For production use, implement server-side key management
- All chat data remains **local** - no data is sent to NexusChat servers

---

## 📦 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel auto-detects Vite configuration

3. **Configure Environment Variables**

   **For Free Tier Support (Recommended):**
   - Add `OPENROUTER_API_KEY` - Shared API key for free tier users
     - Create a dedicated key at [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)
     - Set daily credit limit (e.g., $0.50/day) to control costs

   **Optional:**
   - Add `VITE_OPENROUTER_API_KEY` for default client-side API key
   - Add `VITE_GOOGLE_API_KEY` for Gemini integration

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at `your-project.vercel.app`

> ⚠️ **Important**: The `OPENROUTER_API_KEY` (without VITE_ prefix) is used by the serverless API proxy and is never exposed to the client. This enables the free tier feature securely.

### Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to Netlify

3. Configure redirects in `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Docker (Coming Soon)

Docker support is planned for v1.4.0.

---

## 🗺️ Roadmap

### v1.4.0 (Current) ✅
- [x] **Free Tier Support** - Start using without API key (daily limit)
- [x] **Serverless API Proxy** - Secure API key management via Vercel Edge Functions
- [x] **Improved Onboarding** - Better guidance for new users and API key setup
- [ ] Docker containerization
- [ ] Vision model support (image input)

### v1.5.0 (Q2 2025)
- [ ] Voice input/output (TTS/STT)
- [ ] Plugin system for extensibility
- [ ] Conversation branching
- [ ] Advanced analytics dashboard

### v1.6.0 (Q3 2025)
- [ ] Multi-user support with authentication
- [ ] Cloud synchronization
- [ ] Team collaboration features

### Future Considerations
- Custom agent workflows (chaining, routing)
- Integration with external tools (web search, calculators)
- Mobile app (React Native)
- Browser extension

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs
- Use the [GitHub Issues](https://github.com/HyxiaoGe/nexus-chat/issues) page
- Include steps to reproduce, expected behavior, and screenshots

### Feature Requests
- Open an issue with the "enhancement" label
- Describe the feature and its use case

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Run type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 💬 Community & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/HyxiaoGe/nexus-chat/issues)
- **Discussions**: [Join community discussions](https://github.com/HyxiaoGe/nexus-chat/discussions)
- **Twitter**: Follow [@HyxiaoGe](https://twitter.com/HyxiaoGe) for updates

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for providing unified API access to multiple LLMs
- [Google Gemini](https://ai.google.dev/) for the powerful Generative AI SDK
- [Lucide](https://lucide.dev/) for beautiful open-source icons
- [Tailwind CSS](https://tailwindcss.com/) for the amazing utility-first CSS framework
- All contributors and users who make this project better

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=HyxiaoGe/nexus-chat&type=Date)](https://star-history.com/#HyxiaoGe/nexus-chat&Date)

---

<div align="center">

**Made with ❤️ by [HyxiaoGe](https://github.com/HyxiaoGe)**

If you find NexusChat useful, please consider giving it a ⭐ on GitHub!

[⬆ Back to Top](#-nexuschat)

</div>
