'use client';

import { useState } from 'react';
import { ListTodo, Zap, FileOutput } from 'lucide-react';
import { useLayout } from '@/stores/workspaceStore';
import { AgentStatus } from './AgentStatus';
import { MessageList } from './MessageList';
import { TaskPanel } from './TaskPanel';
import { SkillsPanel } from './SkillsPanel';
import { ArtifactsPanel } from './ArtifactsPanel';
import { ChatInput } from './ChatInput';
import { cn } from '@/lib/utils';

type PanelTab = 'tasks' | 'skills' | 'artifacts';

export function ChatPanel() {
  const { taskPanelHeight, setTaskPanelHeight } = useLayout();
  const [activeTab, setActiveTab] = useState<PanelTab>('artifacts');

  const openPanel = (tab: PanelTab) => {
    if (taskPanelHeight === 'collapsed') {
      setTaskPanelHeight('30%');
    }
    setActiveTab(tab);
  };

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'tasks':
        return <TaskPanel />;
      case 'skills':
        return <SkillsPanel />;
      case 'artifacts':
        return <ArtifactsPanel />;
      default:
        return <TaskPanel />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Agent Status Header */}
      <AgentStatus />

      {/* Message List - flexible height */}
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>

      {/* Panel Tabs */}
      {taskPanelHeight !== 'collapsed' && (
        <div className="flex border-t border-border">
          <PanelTabButton
            icon={<ListTodo className="h-4 w-4" />}
            label="Tasks"
            active={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
          />
          <PanelTabButton
            icon={<Zap className="h-4 w-4" />}
            label="Skills"
            active={activeTab === 'skills'}
            onClick={() => setActiveTab('skills')}
          />
          <PanelTabButton
            icon={<FileOutput className="h-4 w-4" />}
            label="Artifacts"
            active={activeTab === 'artifacts'}
            onClick={() => setActiveTab('artifacts')}
          />
        </div>
      )}

      {/* Active Panel - collapsible */}
      {taskPanelHeight !== 'collapsed' && (
        <div
          className="border-t border-border"
          style={{
            height: taskPanelHeight === '30%' ? '30%' : '80%',
          }}
        >
          {renderActivePanel()}
        </div>
      )}

      {/* Quick access buttons when panel is collapsed */}
      {taskPanelHeight === 'collapsed' && (
        <div className="flex justify-center gap-2 border-t border-border py-2">
          <button
            onClick={() => openPanel('tasks')}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ListTodo className="h-4 w-4" />
          </button>
          <button
            onClick={() => openPanel('skills')}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Zap className="h-4 w-4" />
          </button>
          <button
            onClick={() => openPanel('artifacts')}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <FileOutput className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Chat Input - fixed at bottom */}
      <div className="border-t border-border">
        <ChatInput />
      </div>
    </div>
  );
}

interface PanelTabButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function PanelTabButton({ icon, label, active, onClick }: PanelTabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 py-2 text-sm transition-colors',
        active
          ? 'border-b-2 border-primary bg-primary/5 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export { AgentStatus } from './AgentStatus';
export { MessageList } from './MessageList';
export { TaskPanel } from './TaskPanel';
export { SkillsPanel } from './SkillsPanel';
export { ArtifactsPanel } from './ArtifactsPanel';
export { ChatInput } from './ChatInput';
