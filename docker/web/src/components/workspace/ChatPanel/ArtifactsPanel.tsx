'use client';

import { useEffect } from 'react';
import { ChevronDown, FileOutput, Loader2, RefreshCw, File, Folder, Trash2, Eye, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useArtifacts, useLayout, useActiveEditor } from '@/stores/workspaceStore';
import type { Artifact } from '@/types/workspace';
import { cn } from '@/lib/utils';

export function ArtifactsPanel() {
  const { artifacts, loading, selectedArtifact, setArtifacts, setLoading, setSelected, removeArtifact } = useArtifacts();
  const { taskPanelHeight, setTaskPanelHeight } = useLayout();
  const { setActiveEditor } = useActiveEditor();

  // Fetch artifacts on mount and periodically
  useEffect(() => {
    fetchArtifacts();
    const interval = setInterval(fetchArtifacts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchArtifacts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/artifacts');
      if (response.ok) {
        const data = await response.json();
        setArtifacts(data.artifacts || []);
      }
    } catch (error) {
      console.error('[artifacts] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const collapsePanel = () => {
    setTaskPanelHeight('collapsed');
  };

  const handleView = (artifact: Artifact) => {
    setSelected(artifact.path);

    // Switch to appropriate editor based on file type
    if (artifact.mimeType === 'application/pdf') {
      setActiveEditor('pdf-reader');
    } else if (artifact.mimeType?.startsWith('image/')) {
      // TODO: Add image viewer
    }
  };

  const handleDownload = async (artifact: Artifact) => {
    const response = await fetch(`/api/v1/files?path=/output${artifact.path}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = artifact.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = async (artifact: Artifact) => {
    if (!confirm(`Delete ${artifact.name}?`)) return;

    try {
      const response = await fetch(`/api/v1/artifacts?path=${encodeURIComponent(artifact.path)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        removeArtifact(artifact.path);
      }
    } catch (error) {
      console.error('[artifacts] Delete error:', error);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <ArtifactsPanelHeader
        onCollapse={collapsePanel}
        onRefresh={fetchArtifacts}
        loading={loading}
        count={artifacts.length}
      />
      <ScrollArea className="flex-1">
        <div className="p-3">
          {loading && artifacts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : artifacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
              <FileOutput className="mb-2 h-8 w-8" />
              <p>No artifacts yet</p>
              <p className="text-xs">Generated files appear in /workspace/output/</p>
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence>
                {artifacts.map((artifact) => (
                  <ArtifactRow
                    key={artifact.path}
                    artifact={artifact}
                    isSelected={artifact.path === selectedArtifact}
                    onView={() => handleView(artifact)}
                    onDownload={() => handleDownload(artifact)}
                    onDelete={() => handleDelete(artifact)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface ArtifactsPanelHeaderProps {
  onCollapse: () => void;
  onRefresh: () => void;
  loading: boolean;
  count: number;
}

function ArtifactsPanelHeader({ onCollapse, onRefresh, loading, count }: ArtifactsPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <div className="flex items-center gap-2">
        <FileOutput className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Artifacts</span>
        {count > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {count}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCollapse}>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface ArtifactRowProps {
  artifact: Artifact;
  isSelected: boolean;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function ArtifactRow({ artifact, isSelected, onView, onDownload, onDelete }: ArtifactRowProps) {
  const isDirectory = artifact.type === 'directory';
  const Icon = isDirectory ? Folder : File;

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format time
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <TooltipProvider>
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className={cn(
          'group flex items-center gap-2 rounded-lg p-2 transition-colors',
          isSelected ? 'bg-primary/10' : 'hover:bg-accent'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{artifact.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatSize(artifact.size)} {artifact.size > 0 && '·'} {formatTime(artifact.modified)}
          </p>
        </div>

        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {artifact.preview && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onView}>
                  <Eye className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View</TooltipContent>
            </Tooltip>
          )}

          {!isDirectory && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDownload}>
                  <Download className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
