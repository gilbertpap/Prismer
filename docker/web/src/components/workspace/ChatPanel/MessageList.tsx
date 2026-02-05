'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, AlertCircle, Wrench, FileText, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SiriOrb } from '@/components/ui/siri-orb';
import { useMessages, useArtifacts, useActiveEditor } from '@/stores/workspaceStore';
import type { Message, ToolCall } from '@/types/workspace';
import { cn } from '@/lib/utils';

// Regex to match file paths in messages (any /workspace/ path with common extensions)
const FILE_PATH_REGEX = /\/workspace\/(?:[^\s"'<>]+\/)?[^\s"'<>]+\.(?:pdf|png|jpg|jpeg|gif|svg|csv|json|tex|py|ipynb|md|txt)/gi;

export function MessageList() {
  const { messages, isStreaming } = useMessages();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <SiriOrb size={64} status="idle" className="mb-4" />
        <h3 className="text-lg font-medium">Welcome to OpenPrismer</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your AI-powered academic research assistant.
          <br />
          Start a conversation below.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="flex flex-col gap-4 p-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.type === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        ) : isError ? (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-destructive text-destructive-foreground">
              <AlertCircle className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <SiriOrb size={32} status={message.streaming ? 'thinking' : 'idle'} />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : isError
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted text-foreground'
        )}
      >
        {/* Message content with file path links */}
        <div className="whitespace-pre-wrap text-sm">
          <MessageContent content={message.content} />
          {message.streaming && (
            <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current" />
          )}
        </div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.toolCalls.map((tool) => (
              <ToolCallCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface MessageContentProps {
  content: string;
}

function MessageContent({ content }: MessageContentProps) {
  const { setSelected } = useArtifacts();
  const { setActiveEditor } = useActiveEditor();

  const handleFileClick = useCallback((filePath: string) => {
    // Extract the path relative to /workspace/
    const workspaceMatch = filePath.match(/\/workspace\/(.+)/);
    if (workspaceMatch) {
      // Keep the full relative path (e.g., /output/file.pdf or /projects/file.txt)
      const relativePath = '/' + workspaceMatch[1];
      setSelected(relativePath);

      // Switch to appropriate viewer based on extension
      const ext = filePath.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        setActiveEditor('pdf-reader');
      } else if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) {
        setActiveEditor('image-viewer');
      } else if (ext === 'tex') {
        setActiveEditor('latex');
      } else if (ext === 'ipynb') {
        setActiveEditor('jupyter');
      }
    }
  }, [setSelected, setActiveEditor]);

  // Parse content and replace file paths with clickable links
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex lastIndex
  FILE_PATH_REGEX.lastIndex = 0;

  while ((match = FILE_PATH_REGEX.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Add clickable file path
    const filePath = match[0];
    const fileName = filePath.split('/').pop() || filePath;

    parts.push(
      <FileLink
        key={match.index}
        filePath={filePath}
        fileName={fileName}
        onClick={() => handleFileClick(filePath)}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return <>{parts}</>;
}

interface FileLinkProps {
  filePath: string;
  fileName: string;
  onClick: () => void;
}

function FileLink({ filePath, fileName, onClick }: FileLinkProps) {
  // Determine file icon based on extension
  const ext = fileName.split('.').pop()?.toLowerCase();
  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '');

  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-primary transition-colors hover:bg-primary/20"
    >
      <FileText className="h-3 w-3" />
      <span className="underline-offset-2 group-hover:underline">{fileName}</span>
      <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100" />
    </button>
  );
}

interface ToolCallCardProps {
  tool: ToolCall;
}

function ToolCallCard({ tool }: ToolCallCardProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/50 p-2">
      <div className="flex items-center gap-2 text-xs">
        <Wrench className="h-3 w-3" />
        <span className="font-medium">{tool.tool}</span>
        <span
          className={cn(
            'ml-auto rounded-full px-2 py-0.5 text-xs',
            tool.status === 'running'
              ? 'bg-yellow-500/20 text-yellow-600'
              : tool.status === 'completed'
              ? 'bg-green-500/20 text-green-600'
              : tool.status === 'error'
              ? 'bg-red-500/20 text-red-600'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {tool.status}
        </span>
      </div>
      {tool.output !== undefined && tool.output !== null && (
        <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
          {typeof tool.output === 'string'
            ? tool.output
            : JSON.stringify(tool.output, null, 2)}
        </pre>
      )}
    </div>
  );
}
