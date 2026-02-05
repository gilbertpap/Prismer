// Types for OpenPrismer Web workspace

export type EditorType =
  | 'ai-editor'
  | 'jupyter'
  | 'latex'
  | 'code-playground'
  | 'pdf-reader'
  | 'image-viewer';

export type AgentStatus = 'idle' | 'connecting' | 'connected' | 'error';

export type TaskPanelHeight = 'collapsed' | '30%' | '80%';

export type MessageType =
  | 'text'
  | 'markdown'
  | 'code'
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'error';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  type: MessageType;
  content: string;
  timestamp: string;
  actions?: AgentAction[];
  interactive?: InteractiveComponent[];
  streaming?: boolean;
  toolCalls?: ToolCall[];
}

export interface AgentAction {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result';
  content: string;
  timestamp: string;
}

export interface ToolCall {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export interface InteractiveComponent {
  id: string;
  type: 'button_group' | 'choice_card' | 'progress_card';
  props: Record<string, unknown>;
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  subtasks: SubTask[];
  outputs?: TaskOutput[];
}

export interface SubTask {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export interface TaskOutput {
  type: 'file' | 'url' | 'text';
  value: string;
  label?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  editorType?: EditorType;
}

export interface Session {
  id: string;
  created_at: string;
  last_active_at?: string;
  message_count: number;
}

// UI Directives from Agent
export type UIDirective =
  | { type: 'switch_editor'; payload: { editor: EditorType } }
  | { type: 'load_document'; payload: { editor: EditorType; url: string; title?: string } }
  | { type: 'update_content'; payload: { editor: EditorType; content: string } }
  | { type: 'show_notification'; payload: { title: string; message: string; variant: 'info' | 'success' | 'warning' | 'error' } }
  | { type: 'open_task_panel'; payload: { height: TaskPanelHeight } }
  | { type: 'scroll_to'; payload: { editor: EditorType; position: { line: number; column: number } } };

// Skill types
export interface Skill {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  path: string;
  enabled: boolean;
  content?: string;
}

// Artifact types
export interface Artifact {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size: number;
  modified: string;
  mimeType?: string;
  preview?: boolean;
}

// Config types
export interface RuntimeConfig {
  apiKey: string | null;
  provider: 'anthropic' | 'openai' | 'google';
  model: string;
  configured: boolean;
}

// API Response types
export interface ChatResponse {
  message_id: string;
  session_id: string;
  content: string;
  tool_calls?: ToolCall[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface StatusResponse {
  container: {
    version: string;
    uptime_seconds: number;
    started_at: string;
  };
  identity: {
    workspace_id: string;
    agent_instance_id: string;
  };
  services: Record<string, { status: string; port: number }>;
  agent: {
    model: string;
    sessions_active: number;
    requests_handled: number;
  };
}
