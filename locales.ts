
export const resources = {
  en: {
    translation: {
      common: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        create: "Create",
        close: "Close",
        you: "You",
        unknown: "Unknown",
        copy: "Copy",
        copied: "Copied",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        failed: "Failed"
      },
      sidebar: {
        newChat: "New Chat",
        noSessions: "No active conversations.\nStart a new one!",
        deleteSession: "Delete Session",
        footer: "Multi-LLM Orchestrator v{{version}}"
      },
      app: {
        title: "NexusChat",
        activeAgents_one: "1 active agent",
        activeAgents_other: "{{count}} active agents",
        settings: "Settings",
        welcomeTitle: "NexusChat",
        welcomeSubtitle: "Orchestrate multiple LLMs in a single unified view.",
        configureAgents: "Configure Agents",
        agentsReady: "Ready",
        inputPlaceholder: "Send a message...",
        generating: "Generating responses...",
        enterToSend: "Enter to send, Shift+Enter for new line",
        ctrlToSend: "Ctrl+Enter to send",
        noAgentsEnabled: "No agents enabled. Please check Settings > My Agents.",
        configError: "Configuration Error",
        typing: "typing...",
        emptyResponse: "Empty response",
        thinking: "Deep Reasoning",
        chainOfThought: "Chain of Thought",
        systemPrompt: "System Prompt",
        startSuggestion: "Start with a suggestion",
        updateAvailable: "New version available",
        clickToRefresh: "Refresh to apply updates",
        refresh: "Refresh",
        stop: "Stop Generating"
      },
      suggestions: {
        creative: {
          label: "Creative Writing",
          prompt: "Write a short sci-fi story about a robot who loves gardening."
        },
        code: {
          label: "Code Assistant",
          prompt: "Explain the difference between React useMemo and useCallback with examples."
        },
        brainstorm: {
          label: "Brainstorming",
          prompt: "Give me 5 unique marketing ideas for a coffee shop."
        },
        philosophy: {
          label: "Philosophy",
          prompt: "Summarize the core concepts of Stoicism in simple terms."
        }
      },
      settings: {
        title: "Settings",
        subtitle: "NexusChat Configuration",
        nav: {
          general: "General",
          agents: "My Agents",
          providers: "Providers",
          data: "Data & Storage"
        },
        general: {
          title: "General Settings",
          desc: "Customize your interface and preferences.",
          appearance: "Appearance",
          theme: "Theme Mode",
          themeDesc: "Switch between light and dark interfaces.",
          light: "Light",
          dark: "Dark",
          themeChanged: "Switched to {{theme}} Mode",
          language: "Language",
          languageDesc: "Select your preferred interface language.",
          input: "Input Preferences",
          enterToSend: "Enter to Send",
          enterToSendDesc: "If disabled, use Cmd+Enter (Mac) or Ctrl+Enter to send."
        },
        agents: {
          title: "My Agents",
          desc: "Manage your AI personas and their behaviors.",
          edit: "Edit Agent",
          new: "Create New Agent",
          name: "Name",
          avatar: "Avatar",
          provider: "Provider",
          modelId: "Model ID",
          systemPrompt: "System Prompt",
          save: "Save Agent",
          delete: "Delete Agent",
          placeholderName: "Agent Name",
          placeholderModel: "Select or type...",
          placeholderPrompt: "How should this agent behave?",
          agentNameRequired: "Agent name is required",
          agentSaved: "Agent saved successfully",
          agentDeleted: "Agent deleted"
        },
        editor: {
            preview: "Agent Preview",
            manualMode: "Switch to Manual Mode",
            guidedMode: "Switch to Guided Mode",
            providerConnection: "Provider Connection",
            manualModelId: "Model ID (Manual)",
            modelIdPlaceholder: "e.g. deepseek/deepseek-r1",
            advanced: "Advanced Configuration",
            temperature: "Temperature",
            precise: "Precise (0)",
            creative: "Creative (2)",
            topP: "Top P",
            narrow: "Narrow (0)",
            broad: "Broad (1)",
            maxTokens: "Max Output Tokens",
            noLimit: "No Limit",
            select: "Select...",
            search: "Search...",
            noOptions: "No options found",
            selectBrand: "Select Brand (e.g. DeepSeek, OpenAI)",
            selectModel: "Select Model",
            noModelsFound: "No models found for this brand. Try syncing providers in the 'Providers' tab.",
            selectConnection: "Select Connection (e.g. OpenRouter)"
        },
        providers: {
          title: "Providers",
          desc: "Configure API keys and connection endpoints.",
          infoTitle: "Why configure providers?",
          infoDesc: "Providers are the actual AI services. Configure them once (API Key, URL) and link multiple agents to them.",
          name: "Provider Name",
          baseUrl: "Base URL",
          apiKey: "API Key",
          apiKeyOptional: "(Optional if using Env)",
          defaultCorrect: "(Default is correct)",
          verifySync: "Verify & Sync",
          validating: "Key will be validated securely against OpenRouter Auth.",
          cancel: "Cancel",
          saveVerify: "Save & Verify",
          delete: "Delete Provider",
          addCustom: "Add Custom Provider",
          apiKeyRequired: "OpenRouter API Key is required.",
          invalidKey: "Invalid API Key. Please check your OpenRouter credentials.",
          keyVerified: "API Key Verified!",
          syncSuccess: "Verified & Synced models!",
          noModels: "No models found. Check your permissions.",
          saved: "Provider configuration saved",
          confirmDelete: "Delete this provider? associated agents may break.",
          googleApi: "Google Native API",
          openaiApi: "OpenAI Compatible Endpoint",
          connected: "Connected"
        },
        data: {
          title: "Data Management",
          desc: "Export chat history or clear local storage.",
          export: "Export Data",
          exportDesc: "Download all your sessions, messages, and configuration as a JSON file.",
          download: "Download JSON Backup",
          danger: "Danger Zone",
          dangerDesc: "Permanently delete all chat history and custom configurations. This cannot be undone.",
          clear: "Clear All Data",
          confirmClear: "Are you sure you want to wipe all data? This cannot be undone."
        }
      }
    }
  },
  zh: {
    translation: {
      common: {
        save: "保存",
        cancel: "取消",
        delete: "删除",
        edit: "编辑",
        create: "创建",
        close: "关闭",
        you: "你",
        unknown: "未知",
        copy: "复制",
        copied: "已复制",
        loading: "加载中...",
        error: "错误",
        success: "成功",
        failed: "失败"
      },
      sidebar: {
        newChat: "新建会话",
        noSessions: "暂无活跃会话。\n开始一个新的！",
        deleteSession: "删除会话",
        footer: "多模型协作平台 v{{version}}"
      },
      app: {
        title: "NexusChat",
        activeAgents_one: "1 个活跃智能体",
        activeAgents_other: "{{count}} 个活跃智能体",
        settings: "设置",
        welcomeTitle: "NexusChat",
        welcomeSubtitle: "在一个统一视图中协调多个大语言模型。",
        configureAgents: "配置智能体",
        agentsReady: "就绪",
        inputPlaceholder: "发送消息...",
        generating: "正在生成回复...",
        enterToSend: "按 Enter 发送，Shift+Enter 换行",
        ctrlToSend: "按 Ctrl+Enter 发送",
        noAgentsEnabled: "未启用智能体。请检查 设置 > 我的智能体。",
        configError: "配置错误",
        typing: "输入中...",
        emptyResponse: "空回复",
        thinking: "深度思考中",
        chainOfThought: "思维链",
        systemPrompt: "系统提示词",
        startSuggestion: "从建议开始",
        updateAvailable: "发现新版本",
        clickToRefresh: "刷新以应用更新",
        refresh: "立即刷新",
        stop: "停止生成"
      },
      suggestions: {
        creative: {
          label: "创意写作",
          prompt: "写一个关于喜欢园艺的机器人的短篇科幻故事。"
        },
        code: {
          label: "代码助手",
          prompt: "举例解释 React useMemo 和 useCallback 的区别。"
        },
        brainstorm: {
          label: "头脑风暴",
          prompt: "为咖啡店提供5个独特的营销创意。"
        },
        philosophy: {
          label: "哲学思考",
          prompt: "用通俗的语言总结斯多葛学派的核心概念。"
        }
      },
      settings: {
        title: "设置",
        subtitle: "NexusChat 配置",
        nav: {
          general: "通用",
          agents: "智能体",
          providers: "提供商",
          data: "数据存储"
        },
        general: {
          title: "通用设置",
          desc: "自定义界面和偏好。",
          appearance: "外观",
          theme: "主题模式",
          themeDesc: "切换亮色或暗色界面。",
          light: "亮色",
          dark: "暗色",
          themeChanged: "已切换至{{theme}}模式",
          language: "语言",
          languageDesc: "选择界面语言。",
          input: "输入偏好",
          enterToSend: "回车发送",
          enterToSendDesc: "如果禁用，使用 Cmd+Enter (Mac) 或 Ctrl+Enter 发送。"
        },
        agents: {
          title: "我的智能体",
          desc: "管理 AI 角色及其行为。",
          edit: "编辑智能体",
          new: "创建新智能体",
          name: "名称",
          avatar: "头像",
          provider: "提供商",
          modelId: "模型 ID",
          systemPrompt: "系统提示词 (System Prompt)",
          save: "保存智能体",
          delete: "删除智能体",
          placeholderName: "智能体名称",
          placeholderModel: "选择或输入...",
          placeholderPrompt: "这个智能体应该如何表现？",
          agentNameRequired: "智能体名称必填",
          agentSaved: "智能体保存成功",
          agentDeleted: "智能体已删除"
        },
        editor: {
            preview: "智能体预览",
            manualMode: "切换到手动模式",
            guidedMode: "切换到引导模式",
            providerConnection: "提供商连接",
            manualModelId: "模型 ID (手动)",
            modelIdPlaceholder: "例如：deepseek/deepseek-r1",
            advanced: "高级配置",
            temperature: "温度 (Temperature)",
            precise: "精确 (0)",
            creative: "创造性 (2)",
            topP: "核采样 (Top P)",
            narrow: "集中 (0)",
            broad: "多样 (1)",
            maxTokens: "最大输出 Token",
            noLimit: "无限制",
            select: "请选择...",
            search: "搜索...",
            noOptions: "无选项",
            selectBrand: "选择品牌 (例如 DeepSeek, OpenAI)",
            selectModel: "选择模型",
            noModelsFound: "该品牌下未找到模型。请尝试在“提供商”标签页同步。",
            selectConnection: "选择连接 (例如 OpenRouter)"
        },
        providers: {
          title: "提供商",
          desc: "配置 API 密钥和连接端点。",
          infoTitle: "为什么要配置提供商？",
          infoDesc: "提供商是实际的 AI 服务。配置一次（API Key, URL），即可关联多个智能体。",
          name: "提供商名称",
          baseUrl: "Base URL",
          apiKey: "API Key",
          apiKeyOptional: "（如果使用环境变量则可选）",
          defaultCorrect: "（默认即可）",
          verifySync: "验证并同步",
          validating: "密钥将通过 OpenRouter Auth 安全验证。",
          cancel: "取消",
          saveVerify: "保存并验证",
          delete: "删除提供商",
          addCustom: "添加自定义提供商",
          apiKeyRequired: "需要 OpenRouter API Key。",
          invalidKey: "API Key 无效，请检查您的凭证。",
          keyVerified: "API Key 验证通过！",
          syncSuccess: "验证并同步了模型！",
          noModels: "未找到模型。请检查权限。",
          saved: "提供商配置已保存",
          confirmDelete: "删除此提供商？关联的智能体可能会失效。",
          googleApi: "Google 原生 API",
          openaiApi: "OpenAI 兼容端点",
          connected: "已连接"
        },
        data: {
          title: "数据管理",
          desc: "导出聊天记录或清除本地存储。",
          export: "导出数据",
          exportDesc: "将所有会话、消息和配置下载为 JSON 文件。",
          download: "下载 JSON 备份",
          danger: "危险区域",
          dangerDesc: "永久删除所有聊天记录和自定义配置。此操作无法撤销。",
          clear: "清除所有数据",
          confirmClear: "确定要清除所有数据吗？此操作无法撤销。"
        }
      }
    }
  }
};
