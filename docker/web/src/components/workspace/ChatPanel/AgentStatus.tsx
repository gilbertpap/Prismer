'use client';

import { Settings, RotateCcw } from 'lucide-react';
import { SiriOrb } from '@/components/ui/siri-orb';
import { Button } from '@/components/ui/button';
import { useAgentStatus, useMessages, useConfig } from '@/stores/workspaceStore';
import { useAgent } from '@/lib/agent';

export function AgentStatus() {
  const { status, error } = useAgentStatus();
  const { clearMessages } = useMessages();
  const { model } = useConfig();
  const { newSession } = useAgent();

  const statusText = {
    idle: 'Idle',
    connecting: 'Connecting...',
    connected: 'Ready',
    error: error || 'Error',
  };

  const orbStatus = status === 'connected' ? 'active' : status === 'connecting' ? 'thinking' : status;

  const handleNewChat = async () => {
    try {
      await newSession();
    } catch {
      // Error handled in hook
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <SiriOrb size={32} status={orbStatus} />

      <div className="flex-1">
        <div className="text-sm font-medium">OpenPrismer Agent</div>
        <div className="text-xs text-muted-foreground">
          {statusText[status]} · {model}
        </div>
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleNewChat}
          title="New Chat"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
