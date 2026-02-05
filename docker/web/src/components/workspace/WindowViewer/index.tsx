'use client';

import { Suspense, lazy } from 'react';
import { useActiveEditor } from '@/stores/workspaceStore';
import { EditorTabs } from './EditorTabs';
import { Timeline } from './Timeline';
import { Loader2 } from 'lucide-react';

// Lazy load editors
const AIEditor = lazy(() => import('@/components/editors/AIEditor'));
const JupyterNotebook = lazy(() => import('@/components/editors/JupyterNotebook'));
const LatexEditor = lazy(() => import('@/components/editors/LatexEditor'));
const CodePlayground = lazy(() => import('@/components/editors/CodePlayground'));
const PDFReader = lazy(() => import('@/components/editors/PDFReader'));
const ImageViewer = lazy(() => import('@/components/editors/ImageViewer'));

function EditorLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function WindowViewer() {
  const { activeEditor } = useActiveEditor();

  const renderEditor = () => {
    switch (activeEditor) {
      case 'ai-editor':
        return <AIEditor />;
      case 'jupyter':
        return <JupyterNotebook />;
      case 'latex':
        return <LatexEditor />;
      case 'code-playground':
        return <CodePlayground />;
      case 'pdf-reader':
        return <PDFReader />;
      case 'image-viewer':
        return <ImageViewer />;
      default:
        return <AIEditor />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Editor Tabs */}
      <EditorTabs />

      {/* Active Editor */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<EditorLoader />}>{renderEditor()}</Suspense>
      </div>

      {/* Timeline */}
      <Timeline />
    </div>
  );
}

export { EditorTabs } from './EditorTabs';
export { Timeline } from './Timeline';
