# NexusChat 布局优化详细方案

## 一、自适应布局策略

### 1.1 根据AI数量动态调整

| AI数量 | 桌面布局（≥1280px） | 平板布局（768-1279px） | 手机布局（<768px） |
|--------|-------------------|---------------------|------------------|
| 1个    | 1列（居中）        | 1列（全宽）          | 1列（全宽）       |
| 2个    | 2列并排           | 2列并排              | 1列垂直堆叠       |
| 3个    | 3列并排 或 2+1布局 | 2列并排 + 1列下方     | 1列垂直堆叠       |
| 4个    | 2x2网格           | 2列并排              | 1列垂直堆叠       |

### 1.2 每列最小/最佳宽度计算

```typescript
// 最小宽度：确保代码块、表格可读
MIN_COLUMN_WIDTH = 320px

// 最佳宽度：舒适的阅读体验
OPTIMAL_COLUMN_WIDTH = 480px

// 最大宽度：避免单列过宽
MAX_COLUMN_WIDTH = 800px
```

**计算逻辑：**
```typescript
function calculateLayout(enabledAgentsCount: number, availableWidth: number) {
  if (enabledAgentsCount === 1) {
    return { columns: 1, width: Math.min(availableWidth, MAX_COLUMN_WIDTH) };
  }

  if (enabledAgentsCount === 2) {
    const columnWidth = availableWidth / 2;
    return columnWidth >= MIN_COLUMN_WIDTH
      ? { columns: 2, width: columnWidth }
      : { columns: 1, width: availableWidth }; // 退化为垂直布局
  }

  if (enabledAgentsCount === 3) {
    const threeColWidth = availableWidth / 3;
    if (threeColWidth >= OPTIMAL_COLUMN_WIDTH) {
      return { columns: 3, width: threeColWidth }; // 3列并排
    } else {
      return { columns: 2, grid: '2+1' }; // 2上1下布局
    }
  }

  if (enabledAgentsCount === 4) {
    return { columns: 2, rows: 2, width: availableWidth / 2 }; // 2x2网格
  }
}
```

---

## 二、全屏模式设计

### 2.1 全屏模式触发方式

**方式一：顶部工具栏按钮**
```
┌──────────────────────────────────────────────┐
│ Hello... | 162 tokens  [🖼️ 全屏] [⚙️ 设置]  │
└──────────────────────────────────────────────┘
```

**方式二：快捷键**
- `F11` 或 `Cmd/Ctrl + Shift + F` 触发全屏
- `ESC` 退出全屏

### 2.2 全屏模式效果

**普通模式：**
```
┌────────┬──────────────────────────────────────┐
│        │  Header                              │
│ Side   ├──────────┬──────────┬────────────────┤
│ bar    │  AI 1    │  AI 2    │  AI 3          │
│        │          │          │                │
│ 256px  │          │          │                │
└────────┴──────────┴──────────┴────────────────┘
可用宽度：1024px (1280 - 256)
每列：341px (1024/3)
```

**全屏模式：**
```
┌──────────────────────────────────────────────┐
│  Header   [← 返回] [🖼️ 退出全屏]            │
├────────────┬────────────┬────────────────────┤
│  AI 1      │  AI 2      │  AI 3              │
│            │            │                    │
│            │            │                    │
└────────────┴────────────┴────────────────────┘
可用宽度：1920px (全屏)
每列：640px (1920/3) ✅ 舒适的宽度！
```

**4个AI全屏模式：**
```
┌─────────────────────┬─────────────────────┐
│       AI 1          │       AI 2          │
│                     │                     │
│      960px          │      960px          │
├─────────────────────┼─────────────────────┤
│       AI 3          │       AI 4          │
│                     │                     │
│      960px          │      960px          │
└─────────────────────┴─────────────────────┘
```

### 2.3 全屏模式状态管理

```typescript
interface LayoutState {
  isFullscreen: boolean;        // 是否全屏
  sidebarVisible: boolean;       // Sidebar是否可见
  viewMode: 'auto' | 'grid' | 'column'; // 布局模式
  columnCount: number;           // 列数（auto时自动计算）
}

// 全屏模式自动隐藏Sidebar
const toggleFullscreen = () => {
  setLayoutState(prev => ({
    ...prev,
    isFullscreen: !prev.isFullscreen,
    sidebarVisible: !prev.isFullscreen ? false : true
  }));
};
```

---

## 三、具体实施方案

### 3.1 新增组件结构

```
components/
├── layout/
│   ├── FullscreenContainer.tsx      # 全屏容器
│   ├── ResponsiveGrid.tsx           # 响应式网格
│   ├── AgentColumn.tsx              # 单个AI列
│   └── LayoutControls.tsx           # 布局控制工具栏
```

### 3.2 关键组件实现

#### ResponsiveGrid.tsx

```typescript
interface ResponsiveGridProps {
  agents: AgentConfig[];
  messages: Message[];
  isFullscreen: boolean;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  agents,
  messages,
  isFullscreen
}) => {
  const enabledAgents = agents.filter(a => a.enabled);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState(calculateLayout(enabledAgents.length, 1280));

  useEffect(() => {
    const updateLayout = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      setLayout(calculateLayout(enabledAgents.length, width));
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [enabledAgents.length, isFullscreen]);

  // 根据AI数量渲染不同布局
  if (enabledAgents.length <= 2) {
    return (
      <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {enabledAgents.map(agent => (
          <AgentColumn key={agent.id} agent={agent} messages={filterMessages(agent.id)} />
        ))}
      </div>
    );
  }

  if (enabledAgents.length === 3) {
    return layout.columns === 3 ? (
      // 3列并排
      <div ref={containerRef} className="grid grid-cols-3 gap-4 p-4">
        {enabledAgents.map(agent => (
          <AgentColumn key={agent.id} agent={agent} messages={filterMessages(agent.id)} />
        ))}
      </div>
    ) : (
      // 2+1布局
      <div ref={containerRef} className="grid grid-cols-2 gap-4 p-4">
        <AgentColumn agent={enabledAgents[0]} messages={filterMessages(enabledAgents[0].id)} />
        <AgentColumn agent={enabledAgents[1]} messages={filterMessages(enabledAgents[1].id)} />
        <div className="col-span-2">
          <AgentColumn agent={enabledAgents[2]} messages={filterMessages(enabledAgents[2].id)} />
        </div>
      </div>
    );
  }

  // 4个AI：2x2网格
  return (
    <div ref={containerRef} className="grid grid-cols-2 grid-rows-2 gap-4 p-4 h-full">
      {enabledAgents.map(agent => (
        <AgentColumn key={agent.id} agent={agent} messages={filterMessages(agent.id)} />
      ))}
    </div>
  );
};
```

#### AgentColumn.tsx

```typescript
interface AgentColumnProps {
  agent: AgentConfig;
  messages: Message[];
  onStopAgent?: (messageId: string) => void;
  onRegenerateAgent?: (messageId: string) => void;
}

export const AgentColumn: React.FC<AgentColumnProps> = ({
  agent,
  messages,
  onStopAgent,
  onRegenerateAgent
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // 智能滚动：仅在用户在底部时自动滚动
  useEffect(() => {
    if (isNearBottom && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isNearBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setIsNearBottom(scrollHeight - scrollTop - clientHeight < 100);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* 固定头部：Agent信息 */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandIcon brand={agent.brand} className="w-6 h-6" />
            <div>
              <div className="font-semibold text-sm">{agent.name}</div>
              <div className="text-xs text-gray-500">{agent.modelId}</div>
            </div>
          </div>

          {/* 流式状态指示器 */}
          {messages.some(m => m.isStreaming) && (
            <div className="flex items-center gap-1 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">输出中...</span>
            </div>
          )}
        </div>
      </div>

      {/* 消息滚动区域 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">等待回复...</p>
            </div>
          </div>
        )}

        {messages.map(message => (
          <CollapsibleMessageBubble
            key={message.id}
            message={message}
            onStopAgent={onStopAgent}
            onRegenerateAgent={onRegenerateAgent}
          />
        ))}
      </div>

      {/* 滚动到底部按钮 */}
      {!isNearBottom && (
        <button
          onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
          className="absolute bottom-4 right-4 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
```

#### FullscreenContainer.tsx

```typescript
interface FullscreenContainerProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  children: React.ReactNode;
}

export const FullscreenContainer: React.FC<FullscreenContainerProps> = ({
  isFullscreen,
  onToggleFullscreen,
  children
}) => {
  // 监听ESC键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        onToggleFullscreen();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        onToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  if (!isFullscreen) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* 全屏模式顶部栏 */}
      <div className="bg-white dark:bg-gray-800 border-b px-4 py-3 flex items-center justify-between">
        <button
          onClick={onToggleFullscreen}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <X className="w-5 h-5" />
          <span className="text-sm">退出全屏</span>
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">ESC</kbd>
          <span>或</span>
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Shift+F</kbd>
        </div>
      </div>

      {/* 全屏内容区域 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};
```

#### LayoutControls.tsx（布局控制工具栏）

```typescript
export const LayoutControls: React.FC = () => {
  const { isFullscreen, toggleFullscreen } = useLayout();
  const { agents } = useAgents();
  const enabledCount = agents.filter(a => a.enabled).length;

  return (
    <div className="flex items-center gap-2">
      {/* AI数量指示 */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Users className="w-4 h-4" />
        <span>{enabledCount} AI</span>
      </div>

      {/* 全屏按钮 */}
      <button
        onClick={toggleFullscreen}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title={isFullscreen ? "退出全屏 (ESC)" : "全屏模式 (Ctrl+Shift+F)"}
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="w-4 h-4" />
            <span>退出全屏</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-4 h-4" />
            <span>全屏</span>
          </>
        )}
      </button>
    </div>
  );
};
```

---

## 四、App.tsx 重构要点

### 4.1 状态管理

```typescript
// App.tsx 新增状态
const [layoutState, setLayoutState] = useState<LayoutState>({
  isFullscreen: false,
  sidebarVisible: true,
  viewMode: 'auto',
  columnCount: 2
});

const toggleFullscreen = () => {
  setLayoutState(prev => ({
    ...prev,
    isFullscreen: !prev.isFullscreen,
    sidebarVisible: prev.isFullscreen // 退出全屏时恢复Sidebar
  }));
};
```

### 4.2 主布局重构

```typescript
return (
  <FullscreenContainer
    isFullscreen={layoutState.isFullscreen}
    onToggleFullscreen={toggleFullscreen}
  >
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950">
      {/* 条件渲染Sidebar */}
      {layoutState.sidebarVisible && <Sidebar />}

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <SessionInfo />
            <LayoutControls />
          </div>
        </header>

        {/* 响应式网格布局 */}
        <div className="flex-1 overflow-hidden">
          <ResponsiveGrid
            agents={agents}
            messages={messages}
            isFullscreen={layoutState.isFullscreen}
          />
        </div>

        {/* Input Bar */}
        <InputBar />
      </main>
    </div>
  </FullscreenContainer>
);
```

---

## 五、性能优化

### 5.1 虚拟滚动（可选，针对超长对话）

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 100, // 预估消息高度
  overscan: 5 // 预渲染5条消息
});
```

### 5.2 消息分组优化

```typescript
// 按agent分组消息，避免每次渲染重新过滤
const messagesByAgent = useMemo(() => {
  return messages.reduce((acc, msg) => {
    if (!msg.agentId) return acc;
    if (!acc[msg.agentId]) acc[msg.agentId] = [];
    acc[msg.agentId].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);
}, [messages]);
```

### 5.3 防抖窗口resize

```typescript
const debouncedResize = useDebouncedCallback(() => {
  updateLayout();
}, 150);

useEffect(() => {
  window.addEventListener('resize', debouncedResize);
  return () => window.removeEventListener('resize', debouncedResize);
}, []);
```

---

## 六、用户自定义选项（进阶功能）

### 6.1 布局偏好设置

在设置面板中添加：

```typescript
interface LayoutPreferences {
  defaultViewMode: 'auto' | 'grid' | 'vertical';
  preferredColumnCount: number; // 用户偏好的列数
  autoFullscreenOn4Agents: boolean; // 4个AI时自动全屏
  minColumnWidth: number; // 用户可调整最小列宽
}
```

### 6.2 拖拽调整列宽（可选）

```typescript
// 使用react-resizable-panels
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

<PanelGroup direction="horizontal">
  <Panel defaultSize={33} minSize={20}>
    <AgentColumn agent={agents[0]} />
  </Panel>
  <PanelResizeHandle />
  <Panel defaultSize={33} minSize={20}>
    <AgentColumn agent={agents[1]} />
  </Panel>
  <PanelResizeHandle />
  <Panel defaultSize={34} minSize={20}>
    <AgentColumn agent={agents[2]} />
  </Panel>
</PanelGroup>
```

---

## 七、实施优先级

### Phase 1: 核心功能（MVP）
- ✅ ResponsiveGrid 组件
- ✅ AgentColumn 组件
- ✅ 2x2网格布局（4个AI）
- ✅ 全屏模式基础功能

### Phase 2: 体验优化
- ✅ 智能滚动
- ✅ 快捷键支持
- ✅ 布局动画过渡
- ✅ 空状态提示

### Phase 3: 高级功能
- ⚪ 虚拟滚动（长对话性能优化）
- ⚪ 拖拽调整列宽
- ⚪ 用户布局偏好保存
- ⚪ 布局预设模板

---

## 八、回退方案

如果用户不习惯新布局，提供"经典布局"切换：

```typescript
<button onClick={() => setLayoutMode('classic')}>
  切换到经典垂直布局
</button>
```

经典布局保留现有的垂直堆叠模式，但保留折叠优化等改进。

---

## 九、测试场景

### 9.1 功能测试
- [ ] 1-4个AI的各种组合
- [ ] 全屏模式进入/退出
- [ ] 快捷键响应
- [ ] 响应式断点切换

### 9.2 性能测试
- [ ] 100+条消息的滚动性能
- [ ] 4个AI同时流式输出
- [ ] 窗口resize时的重新布局性能

### 9.3 兼容性测试
- [ ] Chrome/Edge/Firefox/Safari
- [ ] 1920x1080、2560x1440等常见分辨率
- [ ] iPad横屏/竖屏
- [ ] 深色模式

---

## 十、预期效果对比

### 当前布局问题：
```
[User] Hello. Is anyone there?
↓
[Claude] Yes, I'm here... (200行内容不断输出)
[GPT-4] Yes. (简短回复，被挤到下方)
[DeepSeek] Yes, I'm here... (长回复继续输出)
[Qwen] Yes. (再次被挤到底部)

❌ 用户需要不断滚动才能看到所有回复
❌ 长短回复混在一起，体验混乱
```

### 优化后效果：
```
┌──────────────┬──────────────┐
│ Claude       │ GPT-4        │
│ Yes, I'm...  │ Yes.         │
│ [Stream...]  │ [Done]       │
│              │              │
│ (独立滚动)    │ (独立滚动)    │
├──────────────┼──────────────┤
│ DeepSeek     │ Qwen         │
│ Yes, I'm...  │ Yes.         │
│ [Stream...]  │ [Done]       │
│              │              │
│ (独立滚动)    │ (独立滚动)    │
└──────────────┴──────────────┘

✅ 一屏查看所有AI回复
✅ 独立滚动，互不干扰
✅ 长短回复各占空间，视觉均衡
```

---

## 附录：技术栈清单

```json
{
  "dependencies": {
    "react-resizable-panels": "^2.0.0",  // 可调整大小的面板（可选）
    "@tanstack/react-virtual": "^3.0.0",  // 虚拟滚动（可选）
    "lucide-react": "已安装"               // 图标库
  }
}
```

---

**下一步行动：**
1. 确认方案细节
2. 创建feature分支
3. 实施Phase 1核心功能
4. 提供演示供测试
