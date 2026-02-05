// Agent communication protocol types

// SSE Event types from server
export type SSEEventType =
  | 'message.start'
  | 'message.delta'
  | 'message.done'
  | 'tool.start'
  | 'tool.result'
  | 'task.progress'
  | 'task.complete'
  | 'error';

export interface SSEEvent {
  event: SSEEventType;
  data: string; // JSON string
}

// Parsed event data types
export interface MessageStartData {
  message_id: string;
  session_id: string;
}

export interface MessageDeltaData {
  content: string;
}

export interface MessageDoneData {
  message_id: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ToolStartData {
  tool_call_id: string;
  tool: string;
  input: Record<string, unknown>;
}

export interface ToolResultData {
  tool_call_id: string;
  tool: string;
  output: unknown;
}

export interface TaskProgressData {
  task_id: string;
  progress: number;
  message?: string;
}

export interface TaskCompleteData {
  task_id: string;
  status: 'completed' | 'error';
  result?: unknown;
}

export interface ErrorData {
  code: string;
  message: string;
}

// Client message types
export interface ChatRequest {
  session_id?: string;
  content: string;
  stream?: boolean;
}

export interface SessionRequest {
  id?: string;
}

// API Response types
export interface APIError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
