'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import {
  useMessages,
  useAgentStatus,
  useConfig,
  useWorkspaceStore,
  useArtifacts,
  useActiveEditor,
  useLayout,
} from '@/stores/workspaceStore';
import type { Message, ToolCall, AgentStatus, EditorType } from '@/types/workspace';

interface UIDirective {
  type: string;
  payload: string;
}

interface SSEEvent {
  type: 'message_start' | 'content_delta' | 'content_stop' | 'tool_use' | 'tool_result' | 'ui_directive' | 'error' | 'done';
  data?: {
    content?: string;
    message_id?: string;
    tool_call?: ToolCall;
    error?: string;
    // UI directive fields
    type?: string;
    payload?: string;
  };
}

interface UseAgentReturn {
  status: AgentStatus;
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<void>;
  cancelRequest: () => void;
  checkConnection: () => Promise<void>;
  newSession: () => Promise<void>;
}

/**
 * Determine the appropriate editor for a file path
 */
function getEditorForFile(filePath: string): EditorType {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';

  switch (ext) {
    case 'pdf':
      return 'pdf-reader';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return 'image-viewer';
    case 'ipynb':
      return 'jupyter';
    case 'tex':
      return 'latex';
    case 'py':
    case 'js':
    case 'ts':
    case 'json':
      return 'code-playground';
    default:
      return 'ai-editor';
  }
}

export function useAgent(): UseAgentReturn {
  const { status, setStatus, setError } = useAgentStatus();
  const {
    sessionId,
    setSessionId,
    addMessage,
    updateMessage,
    appendStreamChunk,
    setStreaming,
    isStreaming,
  } = useMessages();
  const { configured, apiKey, provider, model } = useConfig();
  const { setArtifacts, setSelected: setSelectedArtifact, setLoading: setArtifactsLoading } = useArtifacts();
  const { setActiveEditor } = useActiveEditor();
  const { setTaskPanelHeight } = useLayout();

  const abortControllerRef = useRef<AbortController | null>(null);
  const [localStreaming, setLocalStreaming] = useState(false);

  // Handle UI directives from agent
  const handleDirective = useCallback(async (directive: UIDirective) => {
    console.log('[agent] UI Directive:', directive);

    switch (directive.type) {
      case 'show_artifact':
        // Select the artifact and switch to appropriate viewer
        setSelectedArtifact(directive.payload);
        const editor = getEditorForFile(directive.payload);
        setActiveEditor(editor);
        // Open the panel if collapsed
        setTaskPanelHeight('30%');
        break;

      case 'switch_editor':
        setActiveEditor(directive.payload as EditorType);
        break;

      case 'open_file':
        // Open any workspace file - store the full relative path
        // The path is relative to /workspace/, e.g., /scatter_plot.png or /output/chart.png
        setSelectedArtifact(directive.payload);
        setActiveEditor(getEditorForFile(directive.payload));
        setTaskPanelHeight('30%');
        break;

      case 'refresh_artifacts':
        // Fetch artifacts list
        setArtifactsLoading(true);
        try {
          const response = await fetch('/api/v1/artifacts');
          if (response.ok) {
            const data = await response.json();
            setArtifacts(data.artifacts || []);
          }
        } catch (err) {
          console.error('[agent] Failed to refresh artifacts:', err);
        } finally {
          setArtifactsLoading(false);
        }
        break;

      case 'open_panel':
        // Open a specific panel (artifacts/skills/tasks)
        setTaskPanelHeight('30%');
        break;

      case 'notify':
        // Show notification (could integrate with toast library)
        console.log('[agent] Notification:', directive.payload);
        break;

      default:
        console.log('[agent] Unknown directive type:', directive.type);
    }
  }, [setSelectedArtifact, setActiveEditor, setTaskPanelHeight, setArtifacts, setArtifactsLoading]);

  // Check gateway connection on mount and when config changes
  const checkConnection = useCallback(async () => {
    setStatus('connecting');
    try {
      const response = await fetch('/api/v1/status/health');
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'healthy') {
          setStatus('connected');
          setError(null);
          return;
        }
      }
      throw new Error('Gateway not healthy');
    } catch (err) {
      setStatus('error');
      setError('Unable to connect to OpenClaw Gateway');
    }
  }, [setStatus, setError]);

  // Auto-check connection when configured
  useEffect(() => {
    if (configured) {
      checkConnection();
    }
  }, [configured, checkConnection]);

  // Create new session if needed
  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId;

    const newSessionId = nanoid();
    setSessionId(newSessionId);
    return newSessionId;
  }, [sessionId, setSessionId]);

  // Parse SSE event line
  const parseSSELine = (line: string): SSEEvent | null => {
    if (!line.startsWith('data: ')) return null;

    const data = line.slice(6);
    if (data === '[DONE]') {
      return { type: 'done' };
    }

    try {
      const parsed = JSON.parse(data);

      // Handle different event types
      if (parsed.type) {
        return parsed as SSEEvent;
      }

      // Handle OpenAI-style delta events
      if (parsed.choices?.[0]?.delta?.content) {
        return {
          type: 'content_delta',
          data: { content: parsed.choices[0].delta.content },
        };
      }

      // Handle full message response
      if (parsed.content || parsed.message) {
        return {
          type: 'content_delta',
          data: { content: parsed.content || parsed.message },
        };
      }

      // Handle error
      if (parsed.error) {
        return {
          type: 'error',
          data: { error: parsed.error.message || parsed.error },
        };
      }

      return null;
    } catch {
      return {
        type: 'content_delta',
        data: { content: data },
      };
    }
  };

  // Send message to agent
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || localStreaming) return;

      const currentSessionId = await ensureSession();
      const userMessageId = nanoid();
      const assistantMessageId = nanoid();

      // Add user message
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        type: 'text',
        content,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMessage);

      // Add placeholder for assistant response
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        type: 'text',
        content: '',
        timestamp: new Date().toISOString(),
        streaming: true,
      };
      addMessage(assistantMessage);

      // Start streaming
      setStreaming(true, assistantMessageId);
      setLocalStreaming(true);
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: currentSessionId,
            content,
            stream: true,
            config: {
              api_key: apiKey,
              provider,
              model,
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Request failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let toolCalls: ToolCall[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            const event = parseSSELine(trimmed);
            if (!event) continue;

            switch (event.type) {
              case 'content_delta':
                if (event.data?.content) {
                  appendStreamChunk(assistantMessageId, event.data.content);
                }
                break;

              case 'ui_directive':
                // Handle UI directive from agent
                if (event.data?.type) {
                  await handleDirective({
                    type: event.data.type,
                    payload: event.data.payload || '',
                  });
                }
                break;

              case 'tool_use':
                if (event.data?.tool_call) {
                  toolCalls.push(event.data.tool_call);
                  updateMessage(assistantMessageId, { toolCalls: [...toolCalls] });
                }
                break;

              case 'tool_result':
                if (event.data?.tool_call) {
                  const index = toolCalls.findIndex((t) => t.id === event.data?.tool_call?.id);
                  if (index >= 0) {
                    toolCalls[index] = event.data.tool_call;
                    updateMessage(assistantMessageId, { toolCalls: [...toolCalls] });
                  }
                }
                break;

              case 'error':
                throw new Error(event.data?.error || 'Unknown error');

              case 'done':
                break;
            }
          }
        }

        // Mark streaming complete
        updateMessage(assistantMessageId, { streaming: false });
      } catch (err) {
        const error = err as Error;

        if (error.name === 'AbortError') {
          updateMessage(assistantMessageId, {
            streaming: false,
            content: assistantMessage.content || '[Cancelled]',
          });
          return;
        }

        updateMessage(assistantMessageId, {
          streaming: false,
          type: 'error',
          content: `Error: ${error.message}`,
        });

        setError(error.message);
      } finally {
        setStreaming(false);
        setLocalStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [
      ensureSession,
      addMessage,
      updateMessage,
      appendStreamChunk,
      setStreaming,
      localStreaming,
      apiKey,
      provider,
      model,
      setError,
      handleDirective,
    ]
  );

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreaming(false);
    setLocalStreaming(false);
  }, [setStreaming]);

  // Start a new session
  const newSession = useCallback(async () => {
    cancelRequest();

    const store = useWorkspaceStore.getState();
    store.clearMessages();

    const newSessionId = nanoid();
    store.setSessionId(newSessionId);
  }, [cancelRequest]);

  return {
    status,
    isStreaming: isStreaming || localStreaming,
    sendMessage,
    cancelRequest,
    checkConnection,
    newSession,
  };
}
