'use client';

import {
  FileText,
  Code2,
  FlaskConical,
  FileCode,
  FileSearch,
  Image,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveEditor } from '@/stores/workspaceStore';
import type { EditorType } from '@/types/workspace';

interface EditorTabConfig {
  id: EditorType;
  label: string;
  icon: React.ElementType;
}

const editors: EditorTabConfig[] = [
  { id: 'ai-editor', label: 'Editor', icon: FileText },
  { id: 'jupyter', label: 'Notebook', icon: FlaskConical },
  { id: 'latex', label: 'LaTeX', icon: FileCode },
  { id: 'code-playground', label: 'Code', icon: Code2 },
  { id: 'pdf-reader', label: 'PDF', icon: FileSearch },
  { id: 'image-viewer', label: 'Image', icon: Image },
];

export function EditorTabs() {
  const { activeEditor, setActiveEditor } = useActiveEditor();

  return (
    <div className="border-b border-border bg-muted/30 px-2">
      <Tabs
        value={activeEditor}
        onValueChange={(value) => setActiveEditor(value as EditorType)}
      >
        <TabsList className="h-10 w-full justify-start gap-1 bg-transparent p-0">
          {editors.map((editor) => (
            <TabsTrigger
              key={editor.id}
              value={editor.id}
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <editor.icon className="mr-1.5 h-4 w-4" />
              {editor.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
