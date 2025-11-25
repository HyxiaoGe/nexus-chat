<div align="center">

# 🌐 NexusChat

### 多模型聊天协调器 | 统一 AI 对话平台

[![版本](https://img.shields.io/badge/版本-1.4.0-blue.svg)](https://github.com/HyxiaoGe/nexus-chat)
[![许可证](https://img.shields.io/badge/许可证-MIT-green.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![欢迎PR](https://img.shields.io/badge/PRs-欢迎-brightgreen.svg)](https://github.com/HyxiaoGe/nexus-chat/pulls)

[English](./README.md) | [简体中文](./README.zh-CN.md)

**在统一优雅的界面中同时与多个 AI 模型对话**

🎉 **新功能：免费额度体验 - 无需配置 API Key 即可使用！**

[✨ 功能特性](#-功能特性) • [🚀 快速开始](#-快速开始) • [📸 界面预览](#-界面预览) • [🛠️ 技术栈](#️-技术栈) • [📖 使用文档](#-使用文档)

</div>

---

## 🌟 什么是 NexusChat？

**NexusChat** 是一个强大的开源多智能体聊天协调器，让你能够**同时与多个大语言模型（LLM）对话**。受 Telegram 和 WhatsApp 等现代即时通讯应用启发，NexusChat 提供了流畅的群聊体验，每个 AI 模型都作为独特的"智能体"，拥有自己的个性和能力。

### 🎯 为什么选择 NexusChat？

- **🆓 免费额度可用**：无需 API Key 即可开始体验（有每日限制）
- **🔄 对比 AI 回复**：在一次对话中获得 GPT-4、Claude、Gemini 和 DeepSeek 的不同观点
- **💰 成本追踪**：实时的 token 使用统计和每个模型的成本估算
- **🎨 精美界面**：现代化、响应式设计，支持亮色/暗色主题和流畅动画
- **🌍 通用兼容**：支持 OpenRouter、Google Gemini、OpenAI 以及本地模型（Ollama/LM Studio）
- **🔒 隐私优先**：所有数据都本地存储在浏览器中 - 无需服务器
- **⚡ 实时流式**：体验自然的打字机风格响应，采用 SSE 流式传输

---

## ✨ 功能特性

### 🤖 多智能体系统
- **无限智能体**：创建和管理多个具有自定义个性的 AI 智能体
- **并行生成**：所有智能体同时响应你的提示
- **智能体特定重新生成**：重新生成单个智能体的响应，不影响其他智能体
- **独立停止控制**：在其他智能体继续工作时停止特定智能体的生成

### 💬 高级聊天体验
- **实时流式传输**：使用服务器发送事件（SSE）实现流畅的打字机式文本生成
- **智能内容渲染**：
  - 带语言检测的语法高亮代码块
  - Markdown 支持（表格、列表、格式化）
  - 推理模型的思考过程可视化（DeepSeek R1、o1）
  - 长消息自动折叠，带渐变淡入遮罩
- **消息管理**：编辑用户消息、重新生成 AI 响应、复制/导出对话
- **会话历史**：自动会话分组（今天、昨天、本周、更早）

### 📊 Token 分析与成本追踪
- **每条消息统计**：每个 AI 响应的 token 数量和估算成本
- **会话级别追踪**：当前对话的累计 token 使用量和成本
- **全局统计**：在设置仪表板中按模型查看总使用量
- **OpenRouter 定价**：基于官方定价 API 的实时成本计算

### 🎨 用户体验
- **国际化（i18n）**：完全支持英语和简体中文
- **主题支持**：亮色和暗色模式，带平滑过渡
- **响应式设计**：针对桌面、平板和移动设备优化
- **键盘快捷键**：Enter 发送（可配置为 Ctrl/Cmd+Enter）
- **智能滚动**：智能滚动到底部，带手动滚动检测

### 🔧 提供商集成
- **Google Gemini**：原生 SDK 集成，支持 Gemini 1.5/2.0 模型
- **OpenRouter**：访问 100+ 模型，包括 GPT-4、Claude、Llama、DeepSeek
- **OpenAI 兼容**：连接到任何 OpenAI 兼容端点
- **本地模型**：支持 Ollama、LM Studio 和其他本地推理服务器
- **动态模型加载**：从提供商自动同步模型列表

### 💾 数据管理
- **本地存储**：所有数据存储在浏览器 localStorage（无需服务器）
- **导出/导入**：备份和恢复整个聊天历史和设置
- **会话管理**：创建、删除和组织对话会话
- **提供商持久化**：在本地安全存储 API 密钥（带安全警告）

---

## 📸 界面预览

<div align="center">

### 💬 多智能体聊天界面
![多智能体聊天](./docs/screenshots/chat-interface.png)

### 📊 Token 使用统计
![Token 统计](./docs/screenshots/token-statistics.png)

### ⚙️ 智能体配置
![智能体设置](./docs/screenshots/agent-settings.png)

### 🌓 暗色模式
![暗色模式](./docs/screenshots/dark-mode.png)

</div>

---

## 🚀 快速开始

### 方式一：在线体验（推荐）

直接访问在线演示，使用 **免费额度** 立即开始体验 - 无需任何配置！

> 🎁 **免费额度**：有每日使用限制。如需无限使用，请配置自己的 [OpenRouter API Key](https://openrouter.ai/settings/keys)。

### 方式二：自托管部署

#### 前置要求

- **Node.js** v18.0 或更高版本
- **npm** 或 **yarn** 包管理器
- （可选）提供商的 API 密钥：
  - [Google AI Studio](https://aistudio.google.com/)（Gemini）
  - [OpenRouter](https://openrouter.ai/)（GPT-4、Claude、DeepSeek 等）

#### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/HyxiaoGe/nexus-chat.git
   cd nexus-chat
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   yarn install
   ```

3. **配置环境变量（可选）**
   ```bash
   cp .env.example .env
   ```
   编辑 `.env` 添加默认 API 密钥：
   ```env
   VITE_GOOGLE_API_KEY=your_gemini_api_key
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

5. **打开浏览器**
   访问 `http://localhost:5173`

### 首次使用

**使用免费额度（无需 API Key）：**
1. 打开应用 - 你会看到欢迎弹窗
2. 点击 **"先用免费额度"** 立即开始
3. 开始聊天！所有启用的智能体将使用共享的免费额度响应

**使用自己的 API Key（无限使用）：**
1. 点击右上角的**设置**图标（⚙️）
2. 进入**提供商**标签页
3. 点击 **OpenRouter**，按照引导从 [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) 获取 API Key
4. 粘贴你的 API Key 并点击 **"保存"**
5. 尽情享受 100+ AI 模型的无限访问！

---

## 🛠️ 技术栈

### 前端
- **React 18.2** - 现代 React 与 Hooks
- **TypeScript 5.0** - 类型安全开发
- **Vite 5.x** - 闪电般快速的构建工具
- **Tailwind CSS 3.x** - 实用优先的 CSS 框架

### 状态管理
- **React Hooks** - useState、useEffect、useRef、useMemo
- **自定义 Hooks** - 聊天协调、滚动管理的模块化逻辑
- **LocalStorage API** - 客户端数据持久化

### AI 集成
- **@google/genai** - 官方 Google 生成式 AI SDK
- **OpenRouter API** - 多模型聚合 API
- **服务器发送事件（SSE）** - 实时流式响应

### UI/UX
- **i18next** - 国际化框架
- **Lucide React** - 精美的图标库
- **@lobehub/icons** - AI 模型的品牌图标
- **React Markdown** - Markdown 渲染
- **语法高亮** - 代码块格式化

### 开发工具
- **ESLint** - 代码检查
- **TypeScript 编译器** - 类型检查
- **Vite 构建** - 生产优化

---

## 📖 使用文档

### 配置指南

#### 管理智能体

1. **创建智能体**
   - 进入设置 → 我的智能体
   - 点击"创建新智能体"
   - 配置：
     - **名称**：智能体显示名称
     - **头像**：品牌图标或自定义图片 URL
     - **提供商**：选择 API 提供商
     - **模型 ID**：选择或手动输入模型
     - **系统提示词**：定义智能体行为和个性
     - **高级设置**：Temperature、Top-P、Max Tokens

2. **启用/禁用智能体**
   - 在智能体卡片上切换开关
   - 最多可同时激活 4 个智能体

3. **编辑或删除**
   - 点击铅笔图标进行编辑
   - 点击垃圾桶图标删除（带确认）

#### 添加自定义提供商

NexusChat 支持任何 OpenAI 兼容的 API 端点：

1. 进入设置 → 提供商
2. 点击"添加自定义提供商"
3. 配置：
   - **名称**：提供商显示名称
   - **Base URL**：API 端点（例如 Ollama 的 `http://localhost:11434/v1`）
   - **API Key**：认证密钥（如需要）
4. 点击"保存并验证"以测试连接

**示例配置：**
- **Ollama**：`http://localhost:11434/v1`
- **LM Studio**：`http://localhost:1234/v1`
- **本地 vLLM**：`http://localhost:8000/v1`

#### Token 统计

- **每条消息**：将鼠标悬停在每个 AI 响应中的 token 数量上查看详情
- **会话总计**：在顶部标题栏查看累计 token 和成本
- **全局统计**：在设置 → 我的智能体中查看每个模型的总使用量
- **成本计算**：使用 OpenRouter 定价数据自动计算

### 键盘快捷键

- **Enter**：发送消息（可在设置中配置）
- **Shift + Enter**：在输入框中换行
- **Ctrl/Cmd + Enter**：发送消息（当禁用 Enter 发送时）

### 数据隐私

⚠️ **重要安全提示：**
- API 密钥以**未加密**形式存储在浏览器 `localStorage` 中
- 仅在**可信设备**上使用 NexusChat
- 对于生产环境使用，请实现服务器端密钥管理
- 所有聊天数据保持**本地** - 不会发送到 NexusChat 服务器

---

## 📦 部署

### Vercel（推荐）

1. **推送到 GitHub**
   ```bash
   git add .
   git commit -m "准备部署"
   git push origin main
   ```

2. **导入到 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 点击"导入项目"
   - 选择你的 GitHub 仓库
   - Vercel 自动检测 Vite 配置

3. **配置环境变量**

   **启用免费额度支持（推荐）：**
   - 添加 `OPENROUTER_API_KEY` - 用于免费用户的共享 API Key
     - 在 [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) 创建专用密钥
     - 设置每日额度限制（如 $0.50/天）来控制成本

   **可选配置：**
   - 添加 `VITE_OPENROUTER_API_KEY` 作为客户端默认 API Key
   - 添加 `VITE_GOOGLE_API_KEY` 用于 Gemini 集成

4. **部署**
   - 点击"部署"
   - 你的应用将在 `your-project.vercel.app` 上线

> ⚠️ **重要提示**：`OPENROUTER_API_KEY`（不带 VITE_ 前缀）由服务端 API 代理使用，永远不会暴露给客户端。这确保了免费额度功能的安全性。

### Netlify

1. 构建项目：
   ```bash
   npm run build
   ```

2. 将 `dist` 文件夹部署到 Netlify

3. 在 `netlify.toml` 中配置重定向：
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Docker（即将推出）

Docker 支持计划在 v1.4.0 版本中推出。

---

## 🗺️ 路线图

### v1.4.0（当前版本）✅
- [x] **免费额度支持** - 无需 API Key 即可开始使用（有每日限制）
- [x] **服务端 API 代理** - 通过 Vercel Edge Functions 安全管理 API Key
- [x] **优化新手引导** - 更好的用户引导和 API Key 配置指南
- [ ] Docker 容器化
- [ ] 视觉模型支持（图像输入）

### v1.5.0（2025年第二季度）
- [ ] 语音输入/输出（TTS/STT）
- [ ] 可扩展的插件系统
- [ ] 对话分支
- [ ] 高级分析仪表板

### v1.6.0（2025年第三季度）
- [ ] 带认证的多用户支持
- [ ] 云同步
- [ ] 团队协作功能

### 未来考虑
- 自定义智能体工作流（链接、路由）
- 与外部工具集成（网络搜索、计算器）
- 移动应用（React Native）
- 浏览器扩展

---

## 🤝 贡献

欢迎贡献！以下是你可以帮助的方式：

### 报告错误
- 使用 [GitHub Issues](https://github.com/HyxiaoGe/nexus-chat/issues) 页面
- 包括重现步骤、预期行为和屏幕截图

### 功能请求
- 使用"enhancement"标签开启一个 issue
- 描述功能及其用例

### Pull Requests
1. Fork 仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m '添加惊人的功能'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 开启 Pull Request

### 开发设置
```bash
# 安装依赖
npm install

# 启动带热重载的开发服务器
npm run dev

# 运行类型检查
npm run type-check

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

---

## 💬 社区与支持

- **GitHub Issues**：[报告错误或请求功能](https://github.com/HyxiaoGe/nexus-chat/issues)
- **讨论区**：[加入社区讨论](https://github.com/HyxiaoGe/nexus-chat/discussions)
- **Twitter**：关注 [@HyxiaoGe](https://twitter.com/HyxiaoGe) 获取更新

---

## 📄 许可证

本项目采用 **MIT 许可证** - 详见 [LICENSE](./LICENSE) 文件。

---

## 🙏 致谢

- [OpenRouter](https://openrouter.ai/) 提供统一的多 LLM API 访问
- [Google Gemini](https://ai.google.dev/) 提供强大的生成式 AI SDK
- [Lucide](https://lucide.dev/) 提供精美的开源图标
- [Tailwind CSS](https://tailwindcss.com/) 提供出色的实用优先 CSS 框架
- 所有让这个项目变得更好的贡献者和用户

---

## ⭐ Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=HyxiaoGe/nexus-chat&type=Date)](https://star-history.com/#HyxiaoGe/nexus-chat&Date)

---

<div align="center">

**由 [HyxiaoGe](https://github.com/HyxiaoGe) 用 ❤️ 制作**

如果你觉得 NexusChat 有用，请考虑在 GitHub 上给它一个 ⭐！

[⬆ 返回顶部](#-nexuschat)

</div>
