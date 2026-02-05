'use client';

import { useState } from 'react';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useActiveEditor } from '@/stores/workspaceStore';

// Note: In production, this would use TipTap or ProseMirror
// This is a simplified version for demonstration

export default function AIEditor() {
  const { editorState, updateEditorState } = useActiveEditor();
  const [content, setContent] = useState((editorState as string) || '');

  const handleChange = (value: string) => {
    setContent(value);
    updateEditorState(value);
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newContent =
      content.substring(0, start) +
      prefix +
      selected +
      suffix +
      content.substring(end);

    handleChange(newContent);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => insertMarkdown('**', '**')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => insertMarkdown('*', '*')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => insertMarkdown('# ')}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => insertMarkdown('## ')}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => insertMarkdown('- ')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => insertMarkdown('1. ')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => insertMarkdown('> ')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4">
        <Textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Start writing your research notes..."
          className="h-full min-h-full resize-none border-0 bg-transparent text-base focus-visible:ring-0"
        />
      </div>

      {/* Word count */}
      <div className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        {content.split(/\s+/).filter(Boolean).length} words · {content.length} characters
      </div>
    </div>
  );
}
