'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useLayout } from '@/stores/workspaceStore';
import { ChatPanel } from './ChatPanel';
import { WindowViewer } from './WindowViewer';

export function WorkspaceView() {
  const { chatPanelWidth, setChatPanelWidth } = useLayout();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Add global mouse listeners when dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      setChatPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setChatPanelWidth]);

  return (
    <div
      ref={containerRef}
      className="flex h-screen w-full overflow-hidden bg-background"
    >
      {/* Chat Panel */}
      <div
        className="flex h-full flex-shrink-0 flex-col border-r border-border"
        style={{ width: chatPanelWidth }}
      >
        <ChatPanel />
      </div>

      {/* Resize Handle */}
      <div
        className={`w-1 cursor-col-resize bg-border transition-colors hover:bg-primary/50 ${
          isDragging ? 'bg-primary' : ''
        }`}
        onMouseDown={handleMouseDown}
      />

      {/* Window Viewer */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <WindowViewer />
      </div>
    </div>
  );
}
