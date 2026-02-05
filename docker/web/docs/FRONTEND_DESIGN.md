# ClawBase Web - 单例模式前端设计文档

> **版本**: v1.0
> **日期**: 2026-02-05
> **状态**: 设计阶段
> **目标**: 为开源社区提供一键启动的研究工作台 UI

---

## 目录

1. [项目概述](#1-项目概述)
2. [架构设计](#2-架构设计)
3. [核心功能](#3-核心功能)
4. [UI 组件规范](#4-ui-组件规范)
5. [状态管理](#5-状态管理)
6. [Agent 通信协议](#6-agent-通信协议)
7. [编辑器集成](#7-编辑器集成)
8. [配置系统](#8-配置系统)
9. [样式规范](#9-样式规范)
10. [实施计划](#10-实施计划)

---

## 1. 项目概述

### 1.1 背景

ClawBase Web 是 OpenClaw 容器的内置前端界面，提供开箱即用的研究工作台体验。用户启动容器后，只需配置 API Key 即可开始使用 AI 辅助的研究工作流。

### 1.2 设计原则

```
┌─────────────────────────────────────────────────────────────┐
│                      设计原则                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 单例简化 (Single Instance First)                        │
│     └── 单用户、单 Agent、单工作空间                          │
│                                                             │
│  2. 零配置启动 (Zero Config Start)                          │
│     └── 容器启动即可用，API Key 通过 UI 配置                  │
│                                                             │
│  3. 核心功能优先 (Essential Features Only)                  │
│     └── 聊天、任务、编辑器、时间线                            │
│                                                             │
│  4. 可扩展架构 (Extensible Architecture)                    │
│     └── 预留扩展点，不引入过度设计                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 与 Prismer.AI 的关系

| 特性 | Prismer.AI (闭源) | ClawBase Web (开源) |
|------|------------------|---------------------|
| 用户模式 | 多用户 | 单用户 |
| Agent 数量 | N 个 | 1 个 |
| 工作空间 | 多个 | 1 个 |
| 认证 | OAuth + JWT | API Key |
| 部署 | 云端 SaaS | 本地容器 |
| 同步 | 多端实时同步 | 单端本地 |
| 编辑器 | 8 种 | 5 种 (核心) |

---

## 2. 架构设计

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Container                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ClawBase Web (Port 3000)                │   │
│  │  ┌─────────────────┐  ┌─────────────────────────┐   │   │
│  │  │   Chat Panel    │  │     Window Viewer       │   │   │
│  │  │  ┌───────────┐  │  │  ┌─────────────────┐    │   │   │
│  │  │  │ Messages  │  │  │  │  Editor Tabs    │    │   │   │
│  │  │  ├───────────┤  │  │  ├─────────────────┤    │   │   │
│  │  │  │TaskPanel  │  │  │  │ Active Editor   │    │   │   │
│  │  │  ├───────────┤  │  │  │ (Jupyter/Code/  │    │   │   │
│  │  │  │ActionBar  │  │  │  │  LaTeX/PDF...)  │    │   │   │
│  │  │  ├───────────┤  │  │  ├─────────────────┤    │   │   │
│  │  │  │ChatInput  │  │  │  │   Timeline      │    │   │   │
│  │  │  └───────────┘  │  │  └─────────────────┘    │   │   │
│  │  └─────────────────┘  └─────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                    WebSocket │ HTTP                         │
│                              ↓                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           OpenClaw Gateway (Port 18789)              │   │
│  │                                                      │   │
│  │  • Agent Runtime                                     │   │
│  │  • Tool Execution                                    │   │
│  │  • LLM API Proxy                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | Next.js 15+ | React 19, App Router |
| 状态 | Zustand 5 | 轻量级状态管理 |
| 样式 | Tailwind CSS 4 | 实用类优先 |
| UI 库 | shadcn/ui | Radix 原语 + 定制主题 |
| 图标 | Lucide Icons | 轻量级图标库 |
| 动画 | Framer Motion | 流畅过渡效果 |
| 编辑器 | Monaco Editor | VS Code 同款编辑器 |
| WebSocket | 原生 WebSocket | 无依赖 |

### 2.3 目录结构

```
src/
├── app/
│   ├── page.tsx              # 主页 (配置向导)
│   ├── workspace/
│   │   ├── page.tsx          # 工作台主界面
│   │   └── layout.tsx
│   └── api/
│       └── config/           # 配置 API
│           └── route.ts
│
├── components/
│   ├── workspace/            # 工作台组件
│   │   ├── WorkspaceView.tsx # 主布局
│   │   ├── ChatPanel/
│   │   │   ├── index.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── TaskPanel.tsx
│   │   │   └── ActionBar.tsx
│   │   ├── WindowViewer/
│   │   │   ├── index.tsx
│   │   │   ├── EditorTabs.tsx
│   │   │   └── Timeline.tsx
│   │   └── AgentStatus.tsx
│   │
│   ├── editors/              # 编辑器组件
│   │   ├── AIEditor.tsx
│   │   ├── JupyterNotebook.tsx
│   │   ├── LatexEditor.tsx
│   │   ├── CodePlayground.tsx
│   │   └── PDFReader.tsx
│   │
│   ├── interactive/          # 交互组件
│   │   ├── ButtonGroup.tsx
│   │   ├── ChoiceCard.tsx
│   │   ├── ProgressCard.tsx
│   │   └── CodeBlock.tsx
│   │
│   ├── ui/                   # 基础 UI
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── tooltip.tsx
│   │   └── siri-orb.tsx      # Agent 头像
│   │
│   └── setup/                # 配置向导
│       └── APIKeyForm.tsx
│
├── stores/
│   └── workspaceStore.ts     # Zustand Store
│
├── lib/
│   ├── agent/
│   │   ├── client.ts         # Agent WebSocket 客户端
│   │   ├── types.ts          # 协议类型
│   │   └── hooks.ts          # React Hooks
│   └── utils.ts
│
├── types/
│   └── workspace.ts          # 类型定义
│
└── styles/
    └── globals.css           # Tailwind 入口
```

---

## 3. 核心功能

### 3.1 功能矩阵

| 功能模块 | 优先级 | 状态 | 说明 |
|---------|-------|------|------|
| API Key 配置 | P0 | 设计中 | 首次启动配置向导 |
| Chat 消息列表 | P0 | 设计中 | 用户与 Agent 对话 |
| 消息发送 | P0 | 设计中 | 文本 + @提及 |
| Agent 状态指示 | P0 | 设计中 | 连接/运行/错误状态 |
| Task 面板 | P0 | 设计中 | 任务进度追踪 |
| 编辑器切换 | P0 | 设计中 | 5 种编辑器 Tab |
| 时间线 | P1 | 设计中 | 操作历史回放 |
| 快捷操作栏 | P1 | 设计中 | 常用命令 |
| 流式响应 | P0 | 设计中 | LLM 打字机效果 |
| 交互组件 | P1 | 设计中 | 按钮组、选择卡片 |

### 3.2 用户流程

```
┌─────────────────────────────────────────────────────────────┐
│                     用户启动流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 启动容器                                                 │
│     docker run -p 3000:3000 -p 18789:18789 clawbase:latest  │
│                         │                                    │
│                         ↓                                    │
│  2. 访问 http://localhost:3000                               │
│                         │                                    │
│                         ↓                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              API Key 配置向导                         │    │
│  │                                                      │    │
│  │   请输入您的 API Key:                                 │    │
│  │   ┌────────────────────────────────────────────┐    │    │
│  │   │ sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx       │    │    │
│  │   └────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │   [选择模型: Claude Sonnet 4 ▼]                      │    │
│  │                                                      │    │
│  │               [ 开始使用 ]                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                    │
│                         ↓                                    │
│  3. 进入工作台界面                                           │
│                         │                                    │
│                         ↓                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              研究工作台                               │    │
│  │  ┌────────────┐  ┌─────────────────────────────┐    │    │
│  │  │   Chat     │  │      Jupyter Notebook       │    │    │
│  │  │            │  │                             │    │    │
│  │  │ Agent: Hi! │  │  In [1]: import pandas...   │    │    │
│  │  │            │  │                             │    │    │
│  │  └────────────┘  └─────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 功能详述

#### 3.3.1 API Key 配置

```typescript
interface ConfigState {
  apiKey: string;
  provider: 'anthropic' | 'openai';
  model: string;
  configured: boolean;
}

// 配置持久化到 localStorage
// 首次访问检查配置，未配置则显示向导
```

**UI 设计**:
- 居中卡片布局
- API Key 输入框（密码模式，可切换显示）
- Provider 选择（Anthropic / OpenAI）
- Model 下拉选择
- 验证按钮 + 加载状态
- 错误提示

#### 3.3.2 Chat 消息列表

**消息类型**:
```typescript
type MessageType =
  | 'text'           // 纯文本
  | 'markdown'       // Markdown 渲染
  | 'code'           // 代码块
  | 'thinking'       // Agent 思考过程
  | 'tool_call'      // 工具调用
  | 'tool_result'    // 工具结果
  | 'error'          // 错误信息

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  type: MessageType;
  content: string;
  timestamp: Date;

  // 扩展字段
  actions?: AgentAction[];      // 思考步骤/工具调用
  interactive?: InteractiveComponent[];  // 嵌入的交互组件
  streaming?: boolean;          // 是否正在流式输出
}
```

**渲染规则**:
- 用户消息：右对齐，蓝色气泡
- Agent 消息：左对齐，灰色气泡 + SiriOrb 头像
- 思考过程：折叠式展示，点击展开
- 工具调用：卡片式展示，显示工具名 + 参数 + 结果

#### 3.3.3 Task 面板

```typescript
interface Task {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;  // 0-100
  subtasks: SubTask[];
  outputs?: TaskOutput[];
}

interface SubTask {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}
```

**UI 设计**:
- 可折叠面板（三档高度：折叠/30%/80%）
- 任务列表卡片
- 进度条 + 状态图标
- 子任务树形展示
- 点击任务跳转到相关编辑器

#### 3.3.4 编辑器切换

**支持的编辑器**:
| 编辑器 | 用途 | 核心依赖 |
|--------|------|---------|
| AI Editor | 富文本写作 | TipTap / ProseMirror |
| Jupyter Notebook | 数据分析 | CodeMirror + 自定义 |
| LaTeX Editor | 论文写作 | Monaco + KaTeX |
| Code Playground | 代码执行 | Monaco + WebContainer |
| PDF Reader | 文档阅读 | react-pdf |

**切换机制**:
- Tab 栏横向排列
- 懒加载（首次切换时加载）
- 状态保持（切换不丢失）
- Agent 可通过 UI Directive 切换

---

## 4. UI 组件规范

### 4.1 布局规范

```
┌─────────────────────────────────────────────────────────────┐
│  Header (可选，显示状态)                            48px     │
├────────────────────────┬────────────────────────────────────┤
│                        │                                    │
│    Chat Panel          │         Window Viewer              │
│    (280-600px)         │         (flex: 1)                  │
│                        │                                    │
│  ┌──────────────────┐  │  ┌────────────────────────────┐   │
│  │ Agent Status     │  │  │ Editor Tabs               │   │
│  ├──────────────────┤  │  ├────────────────────────────┤   │
│  │                  │  │  │                            │   │
│  │ Message List     │  │  │                            │   │
│  │                  │  │  │     Active Editor          │   │
│  │                  │  │  │                            │   │
│  ├──────────────────┤  │  │                            │   │
│  │ Task Panel       │  │  ├────────────────────────────┤   │
│  ├──────────────────┤  │  │ Timeline                   │   │
│  │ Action Bar       │  │  └────────────────────────────┘   │
│  ├──────────────────┤  │                                    │
│  │ Chat Input       │  │                                    │
│  └──────────────────┘  │                                    │
│                        │                                    │
├────────────────────────┴────────────────────────────────────┤
│                    Resize Handle                            │
└─────────────────────────────────────────────────────────────┘
```

**布局参数**:
- Chat Panel 宽度：280px - 600px（可拖拽调整）
- 默认宽度：380px
- Task Panel 高度：折叠(40px) / 30% / 80%
- Timeline 高度：80px（固定）
- 间距：16px padding

### 4.2 基础组件

#### Button

```tsx
// 变体
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Danger</Button>

// 尺寸
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

#### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

#### SiriOrb (Agent 头像)

```tsx
// Agent 状态指示器
<SiriOrb
  size="36px"           // 头像大小
  status="active"       // idle | active | thinking | error
  animationDuration={12}
/>
```

**动画效果**:
- idle: 静态渐变
- active: 缓慢旋转光环
- thinking: 快速脉动
- error: 红色警告闪烁

### 4.3 交互组件

#### ButtonGroup

```tsx
// Agent 提供选项让用户选择
<ButtonGroup
  options={[
    { id: 'opt1', label: '选项 A', description: '描述...' },
    { id: 'opt2', label: '选项 B', description: '描述...' },
  ]}
  onSelect={(optionId) => handleSelect(optionId)}
/>
```

#### ChoiceCard

```tsx
// 卡片式多选
<ChoiceCard
  title="选择数据源"
  options={[
    { id: 'csv', icon: <FileIcon />, label: 'CSV 文件' },
    { id: 'api', icon: <CloudIcon />, label: 'API 接口' },
  ]}
  multiSelect={false}
  onSelect={handleSelect}
/>
```

#### ProgressCard

```tsx
// 任务进度卡片
<ProgressCard
  title="正在分析数据..."
  progress={65}
  status="running"
  subtasks={[
    { label: '加载数据', status: 'completed' },
    { label: '数据清洗', status: 'running' },
    { label: '生成报告', status: 'pending' },
  ]}
/>
```

---

## 5. 状态管理

### 5.1 Zustand Store 设计

```typescript
// stores/workspaceStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================
// Types
// ============================================================

type EditorType =
  | 'ai-editor'
  | 'jupyter'
  | 'latex'
  | 'code-playground'
  | 'pdf-reader';

type AgentStatus = 'idle' | 'connecting' | 'connected' | 'error';

type TaskPanelHeight = 'collapsed' | '30%' | '80%';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  type: string;
  content: string;
  timestamp: string;
  actions?: AgentAction[];
  interactive?: InteractiveComponent[];
  streaming?: boolean;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  subtasks: SubTask[];
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  editorType?: EditorType;
}

// ============================================================
// State
// ============================================================

interface WorkspaceState {
  // === 配置状态 ===
  apiKey: string | null;
  provider: 'anthropic' | 'openai';
  model: string;
  configured: boolean;

  // === Agent 状态 ===
  agentStatus: AgentStatus;
  agentError: string | null;

  // === 布局状态 ===
  chatPanelWidth: number;
  taskPanelHeight: TaskPanelHeight;
  chatExpanded: boolean;

  // === Chat 状态 ===
  messages: Message[];
  isStreaming: boolean;
  currentStreamId: string | null;

  // === Task 状态 ===
  tasks: Task[];
  activeTaskId: string | null;

  // === 编辑器状态 ===
  activeEditor: EditorType;
  editorStates: Record<EditorType, unknown>;

  // === 时间线状态 ===
  timeline: TimelineEvent[];
  timelinePosition: number;
}

// ============================================================
// Actions
// ============================================================

interface WorkspaceActions {
  // === 配置 ===
  setConfig: (config: { apiKey: string; provider: string; model: string }) => void;
  clearConfig: () => void;

  // === Agent ===
  setAgentStatus: (status: AgentStatus) => void;
  setAgentError: (error: string | null) => void;

  // === 布局 ===
  setChatPanelWidth: (width: number) => void;
  setTaskPanelHeight: (height: TaskPanelHeight) => void;
  toggleChat: () => void;

  // === Chat ===
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  appendStreamChunk: (id: string, chunk: string) => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean, streamId?: string) => void;

  // === Task ===
  setTasks: (tasks: Task[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setActiveTaskId: (id: string | null) => void;

  // === 编辑器 ===
  setActiveEditor: (editor: EditorType) => void;
  updateEditorState: (editor: EditorType, state: unknown) => void;

  // === 时间线 ===
  addTimelineEvent: (event: TimelineEvent) => void;
  seekTimeline: (position: number) => void;

  // === UI Directives ===
  executeDirective: (directive: UIDirective) => void;
}

// ============================================================
// Store Implementation
// ============================================================

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set, get) => ({
      // Initial State
      apiKey: null,
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      configured: false,

      agentStatus: 'idle',
      agentError: null,

      chatPanelWidth: 380,
      taskPanelHeight: 'collapsed',
      chatExpanded: true,

      messages: [],
      isStreaming: false,
      currentStreamId: null,

      tasks: [],
      activeTaskId: null,

      activeEditor: 'ai-editor',
      editorStates: {},

      timeline: [],
      timelinePosition: 0,

      // Actions
      setConfig: (config) => set({
        apiKey: config.apiKey,
        provider: config.provider as 'anthropic' | 'openai',
        model: config.model,
        configured: true
      }),

      clearConfig: () => set({
        apiKey: null,
        configured: false
      }),

      setAgentStatus: (status) => set({ agentStatus: status }),
      setAgentError: (error) => set({ agentError: error }),

      setChatPanelWidth: (width) => set({
        chatPanelWidth: Math.max(280, Math.min(600, width))
      }),

      setTaskPanelHeight: (height) => set({ taskPanelHeight: height }),

      toggleChat: () => set((state) => ({
        chatExpanded: !state.chatExpanded
      })),

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),

      updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === id ? { ...msg, ...updates } : msg
        ),
      })),

      appendStreamChunk: (id, chunk) => set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === id ? { ...msg, content: msg.content + chunk } : msg
        ),
      })),

      clearMessages: () => set({ messages: [] }),

      setStreaming: (streaming, streamId) => set({
        isStreaming: streaming,
        currentStreamId: streamId || null
      }),

      setTasks: (tasks) => set({ tasks }),

      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        ),
      })),

      setActiveTaskId: (id) => set({ activeTaskId: id }),

      setActiveEditor: (editor) => set({ activeEditor: editor }),

      updateEditorState: (editor, state) => set((prev) => ({
        editorStates: { ...prev.editorStates, [editor]: state },
      })),

      addTimelineEvent: (event) => set((state) => ({
        timeline: [...state.timeline, event],
      })),

      seekTimeline: (position) => set({ timelinePosition: position }),

      executeDirective: (directive) => {
        const { type, payload } = directive;
        switch (type) {
          case 'switch_editor':
            set({ activeEditor: payload.editor });
            break;
          case 'load_document':
            // Load document into editor
            break;
          case 'show_notification':
            // Show toast notification
            break;
          // ... other directives
        }
      },
    }),
    {
      name: 'clawbase-workspace',
      partialize: (state) => ({
        // Only persist these fields
        apiKey: state.apiKey,
        provider: state.provider,
        model: state.model,
        configured: state.configured,
        chatPanelWidth: state.chatPanelWidth,
        messages: state.messages.slice(-100), // Keep last 100 messages
      }),
    }
  )
);

// ============================================================
// Selector Hooks (防止不必要的重渲染)
// ============================================================

export const useConfig = () => useWorkspaceStore((s) => ({
  apiKey: s.apiKey,
  provider: s.provider,
  model: s.model,
  configured: s.configured,
  setConfig: s.setConfig,
  clearConfig: s.clearConfig,
}));

export const useAgentStatus = () => useWorkspaceStore((s) => ({
  status: s.agentStatus,
  error: s.agentError,
  setStatus: s.setAgentStatus,
  setError: s.setAgentError,
}));

export const useMessages = () => useWorkspaceStore((s) => ({
  messages: s.messages,
  isStreaming: s.isStreaming,
  addMessage: s.addMessage,
  updateMessage: s.updateMessage,
  appendStreamChunk: s.appendStreamChunk,
  clearMessages: s.clearMessages,
}));

export const useTasks = () => useWorkspaceStore((s) => ({
  tasks: s.tasks,
  activeTaskId: s.activeTaskId,
  setTasks: s.setTasks,
  updateTask: s.updateTask,
  setActiveTaskId: s.setActiveTaskId,
}));

export const useActiveEditor = () => useWorkspaceStore((s) => ({
  activeEditor: s.activeEditor,
  setActiveEditor: s.setActiveEditor,
  editorState: s.editorStates[s.activeEditor],
  updateEditorState: (state: unknown) => s.updateEditorState(s.activeEditor, state),
}));

export const useLayout = () => useWorkspaceStore((s) => ({
  chatPanelWidth: s.chatPanelWidth,
  taskPanelHeight: s.taskPanelHeight,
  chatExpanded: s.chatExpanded,
  setChatPanelWidth: s.setChatPanelWidth,
  setTaskPanelHeight: s.setTaskPanelHeight,
  toggleChat: s.toggleChat,
}));
```

---

## 6. Agent 通信协议

### 6.1 WebSocket 连接

```typescript
// lib/agent/client.ts

class AgentClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private gatewayUrl: string = 'ws://localhost:18789') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.gatewayUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onclose = () => {
        this.handleDisconnect();
      };

      this.ws.onerror = (error) => {
        reject(error);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: AgentMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(message: ServerMessage): void {
    // Dispatch to store based on message type
    const store = useWorkspaceStore.getState();

    switch (message.type) {
      case 'message':
        store.addMessage(message.payload);
        break;

      case 'stream_start':
        store.setStreaming(true, message.payload.streamId);
        store.addMessage({
          id: message.payload.messageId,
          role: 'assistant',
          type: 'text',
          content: '',
          timestamp: new Date().toISOString(),
          streaming: true,
        });
        break;

      case 'stream_chunk':
        store.appendStreamChunk(message.payload.messageId, message.payload.chunk);
        break;

      case 'stream_end':
        store.setStreaming(false);
        store.updateMessage(message.payload.messageId, { streaming: false });
        break;

      case 'task_update':
        store.updateTask(message.payload.taskId, message.payload);
        break;

      case 'ui_directive':
        store.executeDirective(message.payload);
        break;

      case 'error':
        store.setAgentError(message.payload.message);
        break;
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(() => {});
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }
  }
}

export const agentClient = new AgentClient();
```

### 6.2 消息协议

#### 客户端 → Agent

```typescript
// 发送用户消息
interface SendMessagePayload {
  type: 'user_message';
  payload: {
    content: string;
    context?: {
      activeEditor: EditorType;
      selectedText?: string;
      cursorPosition?: { line: number; column: number };
    };
  };
}

// 用户交互响应
interface InteractionPayload {
  type: 'user_interaction';
  payload: {
    componentId: string;
    actionId: string;
    value?: unknown;
  };
}

// 编辑器事件
interface EditorEventPayload {
  type: 'editor_event';
  payload: {
    editor: EditorType;
    event: 'open' | 'close' | 'change' | 'save';
    data?: unknown;
  };
}
```

#### Agent → 客户端

```typescript
// Agent 消息
interface AgentMessagePayload {
  type: 'message';
  payload: Message;
}

// 流式响应
interface StreamPayload {
  type: 'stream_start' | 'stream_chunk' | 'stream_end';
  payload: {
    streamId: string;
    messageId: string;
    chunk?: string;
  };
}

// 任务更新
interface TaskUpdatePayload {
  type: 'task_update';
  payload: {
    taskId: string;
    status?: Task['status'];
    progress?: number;
    subtasks?: SubTask[];
  };
}

// UI 指令
interface UIDirectivePayload {
  type: 'ui_directive';
  payload: UIDirective;
}

// UI 指令类型
type UIDirective =
  | { type: 'switch_editor'; payload: { editor: EditorType } }
  | { type: 'load_document'; payload: { editor: EditorType; url: string; title?: string } }
  | { type: 'update_content'; payload: { editor: EditorType; content: string } }
  | { type: 'highlight_code'; payload: { editor: EditorType; range: Range } }
  | { type: 'show_notification'; payload: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' } }
  | { type: 'open_task_panel'; payload: { height: TaskPanelHeight } }
  | { type: 'scroll_to'; payload: { editor: EditorType; position: Position } };
```

### 6.3 React Hooks

```typescript
// lib/agent/hooks.ts

import { useEffect, useCallback } from 'react';
import { agentClient } from './client';
import { useAgentStatus, useConfig } from '@/stores/workspaceStore';

export function useAgent() {
  const { status, setStatus, setError } = useAgentStatus();
  const { configured, apiKey } = useConfig();

  useEffect(() => {
    if (!configured || !apiKey) return;

    setStatus('connecting');

    agentClient
      .connect()
      .then(() => {
        setStatus('connected');
        setError(null);
      })
      .catch((error) => {
        setStatus('error');
        setError(error.message);
      });

    return () => {
      agentClient.disconnect();
    };
  }, [configured, apiKey]);

  const sendMessage = useCallback((content: string) => {
    agentClient.send({
      type: 'user_message',
      payload: { content },
    });
  }, []);

  const sendInteraction = useCallback((componentId: string, actionId: string, value?: unknown) => {
    agentClient.send({
      type: 'user_interaction',
      payload: { componentId, actionId, value },
    });
  }, []);

  return {
    status,
    sendMessage,
    sendInteraction,
    isConnected: status === 'connected',
  };
}
```

---

## 7. 编辑器集成

### 7.1 编辑器接口

```typescript
// 所有编辑器实现此接口
interface EditorComponent {
  // 获取当前内容
  getContent(): string | object;

  // 设置内容
  setContent(content: string | object): void;

  // 获取选中内容
  getSelection(): string | null;

  // 滚动到指定位置
  scrollTo(position: Position): void;

  // 高亮范围
  highlight(range: Range): void;

  // 清除高亮
  clearHighlight(): void;
}
```

### 7.2 编辑器实现概述

#### AI Editor

```tsx
// components/editors/AIEditor.tsx

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function AIEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      // Sync to store
    },
  });

  return (
    <div className="ai-editor">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <WordCount editor={editor} />
    </div>
  );
}
```

#### Jupyter Notebook

```tsx
// components/editors/JupyterNotebook.tsx

import { useState } from 'react';
import { CodeMirror } from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

interface Cell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output?: CellOutput;
  status: 'idle' | 'running' | 'completed' | 'error';
}

export function JupyterNotebook() {
  const [cells, setCells] = useState<Cell[]>([
    { id: '1', type: 'code', content: '', status: 'idle' }
  ]);

  const executeCell = async (cellId: string) => {
    // Send to Agent for execution
  };

  return (
    <div className="jupyter-notebook">
      {cells.map((cell) => (
        <NotebookCell
          key={cell.id}
          cell={cell}
          onExecute={() => executeCell(cell.id)}
          onChange={(content) => updateCell(cell.id, content)}
        />
      ))}
      <AddCellButton onClick={addCell} />
    </div>
  );
}
```

#### LaTeX Editor

```tsx
// components/editors/LatexEditor.tsx

import { Editor } from '@monaco-editor/react';

export function LatexEditor() {
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState('');

  const compileLatex = async () => {
    // Send to Agent for compilation
    // Update preview with PDF/HTML output
  };

  return (
    <div className="latex-editor grid grid-cols-2 h-full">
      <div className="editor-pane">
        <Editor
          language="latex"
          value={content}
          onChange={setContent}
          theme="vs-dark"
        />
      </div>
      <div className="preview-pane">
        <PDFPreview src={preview} />
      </div>
    </div>
  );
}
```

#### Code Playground

```tsx
// components/editors/CodePlayground.tsx

import { Editor } from '@monaco-editor/react';
import { WebContainer } from '@webcontainer/api';

export function CodePlayground() {
  const [files, setFiles] = useState<FileTree>({});
  const [terminal, setTerminal] = useState<string[]>([]);

  const runCode = async () => {
    // Execute via WebContainer
  };

  return (
    <div className="code-playground grid grid-cols-[1fr_300px] h-full">
      <div className="editor-area">
        <FileExplorer files={files} />
        <Editor language="typescript" />
      </div>
      <div className="output-area">
        <Terminal lines={terminal} />
        <Preview />
      </div>
    </div>
  );
}
```

#### PDF Reader

```tsx
// components/editors/PDFReader.tsx

import { Document, Page } from 'react-pdf';

export function PDFReader() {
  const [url, setUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="pdf-reader flex h-full">
      <div className="pdf-content flex-1">
        <Document file={url} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
          <Page pageNumber={currentPage} />
        </Document>
      </div>
      <div className="pdf-sidebar w-64">
        <PageThumbnails numPages={numPages} onSelect={setCurrentPage} />
        <Annotations />
      </div>
    </div>
  );
}
```

---

## 8. 配置系统

### 8.1 环境变量

```bash
# .env.local (用户配置)
NEXT_PUBLIC_GATEWAY_URL=ws://localhost:18789
NEXT_PUBLIC_DEFAULT_PROVIDER=anthropic
NEXT_PUBLIC_DEFAULT_MODEL=claude-sonnet-4-20250514

# 容器内置 (不暴露给用户)
GATEWAY_HOST=0.0.0.0
GATEWAY_PORT=18789
```

### 8.2 运行时配置

```typescript
// lib/config.ts

interface RuntimeConfig {
  gatewayUrl: string;
  defaultProvider: 'anthropic' | 'openai';
  defaultModel: string;
  features: {
    jupyterEnabled: boolean;
    latexEnabled: boolean;
    codePlaygroundEnabled: boolean;
    pdfReaderEnabled: boolean;
  };
}

export function getConfig(): RuntimeConfig {
  return {
    gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL || 'ws://localhost:18789',
    defaultProvider: (process.env.NEXT_PUBLIC_DEFAULT_PROVIDER || 'anthropic') as 'anthropic' | 'openai',
    defaultModel: process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'claude-sonnet-4-20250514',
    features: {
      jupyterEnabled: true,
      latexEnabled: true,
      codePlaygroundEnabled: true,
      pdfReaderEnabled: true,
    },
  };
}
```

### 8.3 API Key 验证

```typescript
// app/api/config/validate/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { apiKey, provider } = await request.json();

  try {
    // 向 OpenClaw Gateway 验证 API Key
    const response = await fetch('http://localhost:18789/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, provider }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { valid: false, error: 'Invalid API Key' },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: 'Failed to validate API Key' },
      { status: 500 }
    );
  }
}
```

---

## 9. 样式规范

### 9.1 颜色系统

```css
/* styles/globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* 主色调 - Violet */
    --primary: 262 83% 58%;
    --primary-foreground: 0 0% 100%;

    /* 背景 */
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;

    /* 卡片 */
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;

    /* 边框 */
    --border: 214 32% 91%;

    /* 输入框 */
    --input: 214 32% 91%;

    /* 强调色 */
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;

    /* 状态色 */
    --success: 142 76% 36%;
    --warning: 38 92% 50%;
    --error: 0 84% 60%;
    --info: 199 89% 48%;

    /* Agent 色彩 */
    --agent-thinking: 38 92% 50%;
    --agent-active: 142 76% 36%;
    --agent-error: 0 84% 60%;

    /* 圆角 */
    --radius: 0.5rem;
  }

  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --card: 222 47% 15%;
    --border: 217 33% 25%;
    /* ... dark mode overrides */
  }
}
```

### 9.2 组件样式

```css
@layer components {
  /* 消息气泡 */
  .message-bubble {
    @apply rounded-2xl px-4 py-2 max-w-[80%];
  }

  .message-bubble-user {
    @apply bg-primary text-primary-foreground ml-auto;
  }

  .message-bubble-agent {
    @apply bg-muted text-foreground;
  }

  /* 编辑器容器 */
  .editor-container {
    @apply h-full overflow-hidden rounded-lg border bg-card;
  }

  /* 任务卡片 */
  .task-card {
    @apply rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md;
  }

  /* SiriOrb 动画 */
  .siri-orb {
    @apply relative rounded-full;
    background: conic-gradient(
      from 0deg,
      hsl(var(--primary)),
      hsl(var(--accent)),
      hsl(var(--primary))
    );
  }

  .siri-orb-thinking {
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
}
```

### 9.3 响应式断点

```css
/* Tailwind 默认断点 */
/* sm: 640px */
/* md: 768px */
/* lg: 1024px */
/* xl: 1280px */
/* 2xl: 1536px */

/* ClawBase 优化断点 */
@layer utilities {
  /* 最小宽度检测 */
  .min-w-workspace {
    min-width: 900px;
  }

  /* Chat Panel 响应式 */
  @media (max-width: 1024px) {
    .chat-panel {
      @apply absolute inset-y-0 left-0 z-10 shadow-xl;
    }
  }
}
```

---

## 10. 实施计划

### 10.1 里程碑

```
┌─────────────────────────────────────────────────────────────┐
│                     实施里程碑                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  M1: 基础框架 (Week 1)                                       │
│  ├── Next.js 项目初始化                                      │
│  ├── Tailwind + shadcn/ui 配置                              │
│  ├── Zustand Store 骨架                                     │
│  └── 基础布局组件                                            │
│                                                             │
│  M2: 配置向导 (Week 2)                                       │
│  ├── API Key 输入表单                                        │
│  ├── 验证逻辑                                                │
│  ├── 持久化存储                                              │
│  └── 路由守卫                                                │
│                                                             │
│  M3: Chat 功能 (Week 3-4)                                   │
│  ├── 消息列表组件                                            │
│  ├── 消息输入组件                                            │
│  ├── Agent 连接管理                                          │
│  ├── 流式响应处理                                            │
│  └── 交互组件 (ButtonGroup, ChoiceCard)                     │
│                                                             │
│  M4: Task 面板 (Week 4)                                      │
│  ├── 任务列表组件                                            │
│  ├── 子任务进度                                              │
│  └── 折叠/展开动画                                           │
│                                                             │
│  M5: 编辑器集成 (Week 5-6)                                   │
│  ├── 编辑器切换 Tab                                          │
│  ├── AI Editor (TipTap)                                     │
│  ├── Code Playground (Monaco + WebContainer)                │
│  ├── Jupyter Notebook (基础版)                              │
│  └── PDF Reader (react-pdf)                                 │
│                                                             │
│  M6: 时间线 + 优化 (Week 7)                                  │
│  ├── 时间线组件                                              │
│  ├── 状态快照/恢复                                           │
│  ├── 性能优化                                                │
│  └── 错误处理                                                │
│                                                             │
│  M7: 测试 + 文档 (Week 8)                                    │
│  ├── 单元测试                                                │
│  ├── 集成测试                                                │
│  ├── 用户文档                                                │
│  └── 发布准备                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 任务清单

| # | 任务 | 优先级 | 预估 | 依赖 |
|---|------|-------|------|------|
| 1.1 | Next.js 15 + TypeScript 初始化 | P0 | 0.5d | - |
| 1.2 | Tailwind CSS 4 配置 | P0 | 0.5d | 1.1 |
| 1.3 | shadcn/ui 组件库安装 | P0 | 0.5d | 1.2 |
| 1.4 | Zustand Store 基础结构 | P0 | 1d | 1.1 |
| 1.5 | 基础布局 (WorkspaceView) | P0 | 2d | 1.3 |
| 2.1 | API Key 配置表单 | P0 | 1d | 1.5 |
| 2.2 | 配置验证 API | P0 | 0.5d | 2.1 |
| 2.3 | localStorage 持久化 | P0 | 0.5d | 2.1 |
| 3.1 | MessageList 组件 | P0 | 2d | 1.5 |
| 3.2 | ChatInput 组件 | P0 | 1d | 1.5 |
| 3.3 | AgentClient WebSocket | P0 | 2d | 1.4 |
| 3.4 | 流式响应处理 | P0 | 1d | 3.3 |
| 3.5 | ButtonGroup 交互组件 | P1 | 1d | 3.1 |
| 3.6 | ChoiceCard 交互组件 | P1 | 1d | 3.1 |
| 4.1 | TaskPanel 组件 | P0 | 2d | 1.5 |
| 4.2 | 任务进度动画 | P1 | 0.5d | 4.1 |
| 5.1 | EditorTabs 切换 | P0 | 1d | 1.5 |
| 5.2 | AI Editor (TipTap) | P0 | 2d | 5.1 |
| 5.3 | Code Playground | P0 | 3d | 5.1 |
| 5.4 | Jupyter Notebook | P1 | 3d | 5.1 |
| 5.5 | PDF Reader | P1 | 2d | 5.1 |
| 5.6 | LaTeX Editor | P2 | 2d | 5.1 |
| 6.1 | Timeline 组件 | P1 | 2d | 1.5 |
| 6.2 | 状态快照系统 | P1 | 1d | 6.1 |
| 7.1 | 单元测试 | P1 | 2d | All |
| 7.2 | 用户文档 | P1 | 2d | All |

### 10.3 验收标准

**MVP 验收 (Week 4)**:
- [ ] 用户可通过 UI 配置 API Key
- [ ] 用户可与 Agent 进行对话
- [ ] Agent 响应支持流式输出
- [ ] 显示任务进度

**Beta 验收 (Week 6)**:
- [ ] 5 种编辑器可用
- [ ] Agent 可通过 UI Directive 切换编辑器
- [ ] 编辑器状态在切换时保持

**Release 验收 (Week 8)**:
- [ ] 时间线回放功能
- [ ] 错误处理完善
- [ ] 文档完整
- [ ] 无重大 Bug

---

## 附录

### A. 术语表

| 术语 | 定义 |
|------|------|
| OpenClaw | 开源个人 AI 助手框架 |
| Gateway | OpenClaw 容器内的 WebSocket 服务 |
| UI Directive | Agent 发送的 UI 控制指令 |
| SiriOrb | Agent 头像动画组件 |
| Task Panel | 任务进度追踪面板 |

### B. 参考资源

- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Zustand 文档](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Framer Motion 文档](https://www.framer.com/motion/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [react-pdf](https://react-pdf.org/)

### C. 变更日志

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-02-05 | 初始设计文档 |