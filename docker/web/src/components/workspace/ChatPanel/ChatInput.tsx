'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Paperclip, StopCircle, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAgent } from '@/lib/agent';
import { useMessages, useLayout } from '@/stores/workspaceStore';

export function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, cancelRequest, isStreaming, status } = useAgent();
  const { isStreaming: storeStreaming } = useMessages();
  const { taskPanelHeight, setTaskPanelHeight } = useLayout();

  const isLoading = isStreaming || storeStreaming;
  const isDisabled = status !== 'connected' || !input.trim();

  const handleSubmit = useCallback(async () => {
    if (isDisabled || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  }, [input, isDisabled, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const toggleTaskPanel = () => {
    setTaskPanelHeight(taskPanelHeight === 'collapsed' ? '30%' : 'collapsed');
  };

  return (
    <div className="p-3">
      {/* Action Bar */}
      <div className="mb-2 flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={toggleTaskPanel}
        >
          <ListTodo className="mr-1 h-3 w-3" />
          Tasks
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          <Paperclip className="mr-1 h-3 w-3" />
          Attach
        </Button>
      </div>

      {/* Input Area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            status === 'connected'
              ? 'Ask anything about your research...'
              : 'Connecting to agent...'
          }
          disabled={status !== 'connected'}
          className="min-h-[80px] resize-none pr-12"
          rows={3}
        />

        {/* Send/Stop Button */}
        <div className="absolute bottom-2 right-2">
          {isLoading ? (
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={cancelRequest}
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8"
              onClick={handleSubmit}
              disabled={isDisabled}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Hint */}
      <div className="mt-1 text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
