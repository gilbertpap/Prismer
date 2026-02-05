'use client';

import { useState, useEffect } from 'react';
import {
  FileUp,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useArtifacts } from '@/stores/workspaceStore';

export default function PDFReader() {
  const { selectedArtifact, artifacts } = useArtifacts();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(10);
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Load PDF when selected artifact changes
  useEffect(() => {
    if (selectedArtifact && selectedArtifact.endsWith('.pdf')) {
      loadArtifactPdf(selectedArtifact);
    }
  }, [selectedArtifact]);

  const loadArtifactPdf = async (artifactPath: string) => {
    setLoading(true);
    try {
      // Fetch PDF from workspace (paths are relative to /workspace/)
      const response = await fetch(`/api/v1/files?path=${encodeURIComponent(artifactPath)}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Clean up previous URL
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }

        setPdfUrl(url);
        setFileName(artifactPath.split('/').pop() || null);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('[pdf-reader] Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      // Clean up previous URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setFileName(file.name);
      setCurrentPage(1);
    }
  };

  const handleRefresh = () => {
    if (selectedArtifact) {
      loadArtifactPdf(selectedArtifact);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 25));

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // List PDF artifacts for quick selection
  const pdfArtifacts = artifacts.filter((a) => a.mimeType === 'application/pdf');

  return (
    <div className="flex h-full">
      {/* Main PDF View */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
          {/* Upload */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button variant="outline" size="sm" asChild>
              <span>
                <FileUp className="mr-1 h-4 w-4" />
                Open PDF
              </span>
            </Button>
          </label>

          {selectedArtifact && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}

          {fileName && (
            <span className="max-w-32 truncate text-sm text-muted-foreground">{fileName}</span>
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

          <div className="h-6 w-px bg-border" />

          {/* Page Navigation */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevPage}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {currentPage} / {totalPages}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextPage}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-48">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in PDF..."
              className="h-8 pl-8"
            />
          </div>

          {/* Download */}
          {pdfUrl && (
            <Button variant="ghost" size="sm" asChild>
              <a href={pdfUrl} download={fileName || 'document.pdf'}>
                <Download className="mr-1 h-4 w-4" />
                Download
              </a>
            </Button>
          )}
        </div>

        {/* PDF Content */}
        <ScrollArea className="flex-1 bg-zinc-100 dark:bg-zinc-900">
          <div className="flex items-center justify-center p-8">
            {loading ? (
              <div className="text-center text-muted-foreground">
                <RefreshCw className="mx-auto h-16 w-16 animate-spin opacity-50" />
                <p className="mt-4 text-lg">Loading PDF...</p>
              </div>
            ) : pdfUrl ? (
              <div
                className="bg-white shadow-lg"
                style={{
                  width: `${(595 * zoom) / 100}px`,
                  height: `${(842 * zoom) / 100}px`,
                }}
              >
                <iframe
                  src={`${pdfUrl}#page=${currentPage}`}
                  className="h-full w-full"
                  title="PDF Viewer"
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <FileUp className="mx-auto h-16 w-16 opacity-50" />
                <p className="mt-4 text-lg">No PDF loaded</p>
                <p className="mt-2 text-sm">
                  Click Open PDF to select a file, or select from Artifacts panel
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Sidebar - PDF List & Thumbnails */}
      <div className="w-64 border-l border-border bg-muted/30">
        {/* PDF Artifacts Section */}
        {pdfArtifacts.length > 0 && (
          <>
            <div className="border-b border-border p-3">
              <h3 className="text-sm font-medium">Generated PDFs</h3>
            </div>
            <ScrollArea className="max-h-48">
              <div className="space-y-1 p-2">
                {pdfArtifacts.map((artifact) => (
                  <button
                    key={artifact.path}
                    onClick={() => loadArtifactPdf(artifact.path)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                      selectedArtifact === artifact.path ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    <p className="truncate font-medium">{artifact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(artifact.size / 1024).toFixed(1)} KB
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Page Thumbnails */}
        <div className="border-b border-border p-3">
          <h3 className="text-sm font-medium">Pages</h3>
        </div>
        <ScrollArea className="h-[calc(100%-48px-12rem)]">
          <div className="grid grid-cols-2 gap-2 p-3">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`aspect-[3/4] rounded border bg-white shadow-sm transition-all hover:shadow-md ${
                  currentPage === i + 1 ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                <span className="text-xs text-muted-foreground">{i + 1}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
