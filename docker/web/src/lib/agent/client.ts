import { nanoid } from 'nanoid';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type {
  ChatRequest,
  MessageStartData,
  MessageDeltaData,
  MessageDoneData,
  ToolStartData,
  ToolResultData,
  ErrorData,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface AgentClientOptions {
  onError?: (error: Error) => void;
}

class AgentClient {
  private abortController: AbortController | null = null;

  constructor(private options: AgentClientOptions = {}) {}

  /**
   * Send a chat message and handle SSE stream
   */
  async chat(content: string, sessionId?: string): Promise<void> {
    const store = useWorkspaceStore.getState();

    // Add user message
    const userMessageId = nanoid();
    store.addMessage({
      id: userMessageId,
      role: 'user',
      type: 'text',
      content,
      timestamp: new Date().toISOString(),
    });

    // Prepare request
    const request: ChatRequest = {
      session_id: sessionId || store.sessionId || undefined,
      content,
      stream: true,
    };

    // Create abort controller for cancellation
    this.abortController = new AbortController();

    try {
      store.setStreaming(true);
      store.setAgentStatus('connected');

      const response = await fetch(`${API_BASE}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(request),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle SSE stream
      await this.handleSSEStream(response);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request aborted');
        return;
      }

      store.setAgentStatus('error');
      store.setAgentError((error as Error).message);

      // Add error message
      store.addMessage({
        id: nanoid(),
        role: 'system',
        type: 'error',
        content: `Error: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
      });

      this.options.onError?.(error as Error);
    } finally {
      store.setStreaming(false);
      this.abortController = null;
    }
  }

  /**
   * Handle SSE stream from response
   */
  private async handleSSEStream(response: Response): Promise<void> {
    const store = useWorkspaceStore.getState();
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let currentMessageId: string | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // Store event type for next data line
            continue;
          }

          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              // Handle different event types based on data structure
              if ('message_id' in data && 'session_id' in data && !('usage' in data)) {
                // message.start
                const eventData = data as MessageStartData;
                currentMessageId = eventData.message_id;
                store.setSessionId(eventData.session_id);

                store.addMessage({
                  id: currentMessageId,
                  role: 'assistant',
                  type: 'markdown',
                  content: '',
                  timestamp: new Date().toISOString(),
                  streaming: true,
                });
              } else if ('content' in data && typeof data.content === 'string' && Object.keys(data).length === 1) {
                // message.delta
                const eventData = data as MessageDeltaData;
                if (currentMessageId) {
                  store.appendStreamChunk(currentMessageId, eventData.content);
                }
              } else if ('message_id' in data && 'usage' in data) {
                // message.done
                const eventData = data as MessageDoneData;
                if (currentMessageId) {
                  store.updateMessage(currentMessageId, { streaming: false });
                }
                currentMessageId = null;
              } else if ('tool_call_id' in data && 'input' in data) {
                // tool.start
                const eventData = data as ToolStartData;
                if (currentMessageId) {
                  const currentMessage = store.messages.find(m => m.id === currentMessageId);
                  const toolCalls = currentMessage?.toolCalls || [];
                  store.updateMessage(currentMessageId, {
                    toolCalls: [...toolCalls, {
                      id: eventData.tool_call_id,
                      tool: eventData.tool,
                      input: eventData.input,
                      status: 'running',
                    }],
                  });
                }
              } else if ('tool_call_id' in data && 'output' in data) {
                // tool.result
                const eventData = data as ToolResultData;
                if (currentMessageId) {
                  const currentMessage = store.messages.find(m => m.id === currentMessageId);
                  const toolCalls = currentMessage?.toolCalls?.map(tc =>
                    tc.id === eventData.tool_call_id
                      ? { ...tc, output: eventData.output, status: 'completed' as const }
                      : tc
                  );
                  store.updateMessage(currentMessageId, { toolCalls });
                }
              } else if ('code' in data && 'message' in data) {
                // error
                const eventData = data as ErrorData;
                store.setAgentError(eventData.message);
                store.addMessage({
                  id: nanoid(),
                  role: 'system',
                  type: 'error',
                  content: `Error: ${eventData.message}`,
                  timestamp: new Date().toISOString(),
                });
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', dataStr);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Cancel ongoing request
   */
  cancel(): void {
    this.abortController?.abort();
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/status/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get container status
   */
  async getStatus(): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/status`);
    if (!response.ok) throw new Error('Failed to get status');
    return response.json();
  }

  /**
   * List sessions
   */
  async listSessions(): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/sessions`);
    if (!response.ok) throw new Error('Failed to list sessions');
    return response.json();
  }

  /**
   * Create new session
   */
  async createSession(id?: string): Promise<{ id: string; created_at: string }> {
    const response = await fetch(`${API_BASE}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/v1/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete session');
  }
}

// Singleton instance
export const agentClient = new AgentClient();

export default AgentClient;
