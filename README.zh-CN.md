
# NexusChat - 多模型协作平台

[![English Documentation](https://img.shields.io/badge/Docs-English-blue)](./README.md)

**NexusChat** 是一个专业的多智能体聊天界面，允许您同时与多个大语言模型（LLM）进行对话。它模仿了 Telegram/WhatsApp 的用户体验，但为不同的 AI 模型分配了独立的“角色”（Agent），从而实现并行生成、观点对比和协同推理。

![NexusChat 界面预览](https://placehold.co/1200x600/1a202c/ffffff?text=NexusChat+Interface+Preview)

## ✨ 功能特性

*   **多智能体系统**：一次用户输入可触发无限个 LLM 同时回复。
*   **统一界面**：智能体以群聊气泡流的形式回复，体验流畅。
*   **多提供商支持**：
    *   **Google Gemini**：原生支持 Gemini 1.5 Pro/Flash 和 2.0。
    *   **OpenAI 兼容接口**：通过 OpenRouter 或本地端点（Ollama/LM Studio）支持 **DeepSeek**、**Claude**、**Llama** 和 **GPT-4**。
*   **实时流式输出**：丝滑的打字机效果。
*   **国际化（i18n）**：完全支持英语和中文。
*   **主题切换**：内置亮色和暗色模式。
*   **数据管理**：基于 LocalStorage 的持久化存储，支持数据导出/导入。

## 🚀 快速开始

### 前置要求

*   Node.js (v18+) 或支持 ES Modules 的现代浏览器。
*   [Google Gemini](https://aistudio.google.com/) 或 [OpenRouter](https://openrouter.ai/) 的 API Key。

### 安装步骤

1.  克隆仓库：
    ```bash
    git clone https://github.com/yourusername/nexus-chat.git
    cd nexus-chat
    ```

2.  安装依赖（如果使用 Vite 等本地打包工具）：
    ```bash
    npm install
    ```

3.  配置环境变量：
    复制示例配置文件：
    ```bash
    cp .env.example .env
    ```
    编辑 `.env` 并添加您的默认 API Key（可选，Key 也可以在 UI 设置中配置）。

4.  运行应用：
    ```bash
    npm run dev
    ```

## 🛠 配置指南

### 管理智能体
1.  点击 **设置**（齿轮图标）。
2.  进入 **我的智能体**。
3.  创建新智能体（例如：“代码专家”）。
4.  选择 **提供商**（Google 或 OpenRouter）。
5.  选择 **模型 ID**（例如：`deepseek/deepseek-r1`）。
6.  设置 **系统提示词 (System Prompt)** 以定义角色人设。

### 添加提供商
NexusChat 支持连接到自定义的 OpenAI 兼容接口。
1.  进入 **设置 > 提供商**。
2.  点击 **添加自定义提供商**。
3.  设置 Base URL（例如 Ollama 的地址：`http://localhost:11434/v1`）。
4.  输入 API Key（如不需要可留空或随意填写）。

## 📦 部署

本项目已针对 Vercel 部署（SPA 模式）进行了优化。

1.  推送到 GitHub。
2.  在 Vercel 中导入项目。
3.  Vercel 会自动检测框架设置。
4.  （可选）在 Vercel 环境变量中添加 `API_KEY`。

## 📄 许可证

MIT License.
