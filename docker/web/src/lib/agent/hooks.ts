'use client';

import { useEffect, useCallback, useState } from 'react';
import { agentClient } from './client';
import { useAgentStatus, useMessages, useConfig } from '@/stores/workspaceStore';

/**
 * Hook for agent communication
 */
export function useAgent() {
  const { status, setStatus, setError } = useAgentStatus();
  const { isStreaming, sessionId, setSessionId, clearMessages } = useMessages();
  const { configured } = useConfig();

  // Check health on mount
  useEffect(() => {
    if (!configured) return;

    const checkHealth = async () => {
      setStatus('connecting');
      const healthy = await agentClient.checkHealth();
      setStatus(healthy ? 'connected' : 'error');
      if (!healthy) {
        setError('Cannot connect to backend');
      }
    };

    checkHealth();
  }, [configured, setStatus, setError]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!configured) {
        setError('API not configured');
        return;
      }

      await agentClient.chat(content, sessionId || undefined);
    },
    [configured, sessionId, setError]
  );

  const cancelRequest = useCallback(() => {
    agentClient.cancel();
  }, []);

  const newSession = useCallback(async () => {
    try {
      const session = await agentClient.createSession();
      setSessionId(session.id);
      clearMessages();
      return session;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    }
  }, [setSessionId, clearMessages, setError]);

  return {
    status,
    isStreaming,
    isConnected: status === 'connected',
    sessionId,
    sendMessage,
    cancelRequest,
    newSession,
  };
}

/**
 * Hook for container status
 */
export function useContainerStatus() {
  const [status, setStatus] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agentClient.getStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Refresh every 30 seconds
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { status, loading, error, refresh };
}

/**
 * Hook for session management
 */
export function useSessions() {
  const [sessions, setSessions] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await agentClient.listSessions()) as { sessions: unknown[] };
      setSessions(data.sessions || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createSession = useCallback(async (id?: string) => {
    const session = await agentClient.createSession(id);
    await refresh();
    return session;
  }, [refresh]);

  const deleteSession = useCallback(async (sessionId: string) => {
    await agentClient.deleteSession(sessionId);
    await refresh();
  }, [refresh]);

  return {
    sessions,
    loading,
    error,
    refresh,
    createSession,
    deleteSession,
  };
}
