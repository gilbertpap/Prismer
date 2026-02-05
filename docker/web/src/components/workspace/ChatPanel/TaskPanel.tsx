'use client';

import { ChevronDown, ChevronUp, CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTasks, useLayout } from '@/stores/workspaceStore';
import type { Task, SubTask } from '@/types/workspace';
import { cn } from '@/lib/utils';

export function TaskPanel() {
  const { tasks, activeTaskId, setActiveTaskId } = useTasks();
  const { taskPanelHeight, setTaskPanelHeight } = useLayout();

  const toggleHeight = () => {
    setTaskPanelHeight(taskPanelHeight === '30%' ? '80%' : '30%');
  };

  const collapsePanel = () => {
    setTaskPanelHeight('collapsed');
  };

  if (tasks.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <TaskPanelHeader
          onToggle={toggleHeight}
          onCollapse={collapsePanel}
          isExpanded={taskPanelHeight === '80%'}
        />
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          No active tasks
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <TaskPanelHeader
        onToggle={toggleHeight}
        onCollapse={collapsePanel}
        isExpanded={taskPanelHeight === '80%'}
      />
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isActive={task.id === activeTaskId}
              onClick={() => setActiveTaskId(task.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface TaskPanelHeaderProps {
  onToggle: () => void;
  onCollapse: () => void;
  isExpanded: boolean;
}

function TaskPanelHeader({ onToggle, onCollapse, isExpanded }: TaskPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <span className="text-sm font-medium">Tasks</span>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle}>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCollapse}>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  isActive: boolean;
  onClick: () => void;
}

function TaskCard({ task, isActive, onClick }: TaskCardProps) {
  return (
    <motion.div
      layout
      className={cn(
        'cursor-pointer rounded-lg border bg-card p-3 transition-shadow hover:shadow-md',
        isActive && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <TaskStatusIcon status={task.status} />
        <span className="flex-1 text-sm font-medium">{task.title}</span>
        <span className="text-xs text-muted-foreground">{task.progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            'h-full',
            task.status === 'completed'
              ? 'bg-green-500'
              : task.status === 'error'
              ? 'bg-red-500'
              : 'bg-primary'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${task.progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Subtasks */}
      {task.subtasks.length > 0 && (
        <div className="mt-3 space-y-1">
          {task.subtasks.map((subtask) => (
            <SubTaskItem key={subtask.id} subtask={subtask} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface SubTaskItemProps {
  subtask: SubTask;
}

function SubTaskItem({ subtask }: SubTaskItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <TaskStatusIcon status={subtask.status} size={12} />
      <span className="text-muted-foreground">{subtask.title}</span>
    </div>
  );
}

interface TaskStatusIconProps {
  status: Task['status'] | SubTask['status'];
  size?: number;
}

function TaskStatusIcon({ status, size = 16 }: TaskStatusIconProps) {
  const iconProps = { className: 'flex-shrink-0', style: { width: size, height: size } };

  switch (status) {
    case 'completed':
      return <CheckCircle2 {...iconProps} className={cn(iconProps.className, 'text-green-500')} />;
    case 'running':
      return <Loader2 {...iconProps} className={cn(iconProps.className, 'animate-spin text-primary')} />;
    case 'error':
      return <XCircle {...iconProps} className={cn(iconProps.className, 'text-red-500')} />;
    default:
      return <Circle {...iconProps} className={cn(iconProps.className, 'text-muted-foreground')} />;
  }
}
