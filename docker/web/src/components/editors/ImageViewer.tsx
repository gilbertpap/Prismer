'use client';

import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download, Image as ImageIcon, RefreshCw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useArtifacts } from '@/stores/workspaceStore';

export default function ImageViewer() {
  const { selectedArtifact, artifacts } = useArtifacts();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load image when selected artifact changes
  useEffect(() => {
    if (selectedArtifact && isImageFile(selectedArtifact)) {
      loadArtifactImage(selectedArtifact);
    }
  }, [selectedArtifact]);

  const isImageFile = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '');
  };

  const loadArtifactImage = async (artifactPath: string) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch image from workspace (paths are relative to /workspace/)
      const response = await fetch(`/api/v1/files?path=${encodeURIComponent(artifactPath)}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Clean up previous URL
        if (imageUrl) {
          URL.revokeObjectURL(imageUrl);
        }

        setImageUrl(url);
        setFileName(artifactPath.split('/').pop() || null);
        setZoom(100);
        setRotation(0);
      } else {
        throw new Error('Failed to load image');
      }
    } catch (err) {
      console.error('[image-viewer] Load error:', err);
      setError('Failed to load image');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedArtifact) {
      loadArtifactImage(selectedArtifact);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(400, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(25, z - 25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleFitToScreen = () => setZoom(100);

  const handleDownload = () => {
    if (imageUrl && fileName) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // List image artifacts for quick selection
  const imageArtifacts = artifacts.filter((a) => isImageFile(a.path));

  return (
    <div className="flex h-full">
      {/* Main Image View */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
          {selectedArtifact && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}

          {fileName && (
            <span className="max-w-48 truncate text-sm text-muted-foreground">{fileName}</span>
          )}

          <div className="h-6 w-px bg-border" />

          {/* Zoom */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFitToScreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* Rotate */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          {/* Download */}
          {imageUrl && (
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="mr-1 h-4 w-4" />
              Download
            </Button>
          )}
        </div>

        {/* Image Content */}
        <ScrollArea className="flex-1 bg-zinc-100 dark:bg-zinc-900">
          <div className="flex min-h-full items-center justify-center p-8">
            {loading ? (
              <div className="text-center text-muted-foreground">
                <RefreshCw className="mx-auto h-16 w-16 animate-spin opacity-50" />
                <p className="mt-4 text-lg">Loading image...</p>
              </div>
            ) : error ? (
              <div className="text-center text-destructive">
                <ImageIcon className="mx-auto h-16 w-16 opacity-50" />
                <p className="mt-4 text-lg">{error}</p>
              </div>
            ) : imageUrl ? (
              <div
                className="relative overflow-hidden rounded-lg bg-white shadow-lg"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-out',
                }}
              >
                <img
                  src={imageUrl}
                  alt={fileName || 'Image'}
                  className="max-w-none"
                  style={{
                    maxHeight: '80vh',
                  }}
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="mx-auto h-16 w-16 opacity-50" />
                <p className="mt-4 text-lg">No image loaded</p>
                <p className="mt-2 text-sm">
                  Select an image from the Artifacts panel
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Sidebar - Image List */}
      <div className="w-64 border-l border-border bg-muted/30">
        <div className="border-b border-border p-3">
          <h3 className="text-sm font-medium">Generated Images</h3>
        </div>
        <ScrollArea className="h-[calc(100%-48px)]">
          {imageArtifacts.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No images in output
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {imageArtifacts.map((artifact) => (
                <button
                  key={artifact.path}
                  onClick={() => loadArtifactImage(artifact.path)}
                  className={`group relative w-full overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md ${
                    selectedArtifact === artifact.path ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="aspect-video bg-muted">
                    <img
                      src={`/api/v1/files?path=${encodeURIComponent(artifact.path)}`}
                      alt={artifact.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2 text-left">
                    <p className="truncate text-xs font-medium">{artifact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(artifact.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
