'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Play, Download, FileText, Loader2, Check, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const SAMPLE_LATEX = `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{graphicx}

\\title{Research Paper Title}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
This is the abstract of your paper. It should briefly summarize the key points.
\\end{abstract}

\\section{Introduction}
Your introduction goes here. This section should provide background and motivation.

\\section{Methods}
Describe your methods and approach.

\\subsection{Data Collection}
Explain how data was collected.

\\subsection{Analysis}
Describe the analysis techniques used.

\\section{Results}
Present your results with clarity.

\\begin{equation}
E = mc^2
\\end{equation}

\\section{Conclusion}
Summarize your findings and their implications.

\\end{document}`;

export default function LatexEditor() {
  const [content, setContent] = useState(SAMPLE_LATEX);
  const [engine, setEngine] = useState('pdflatex');
  const [compiling, setCompiling] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  // Check service status on mount
  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    setServiceStatus('checking');
    try {
      const response = await fetch('/api/v1/services/latex');
      const data = await response.json();
      setServiceStatus(data.status === 'available' ? 'available' : 'unavailable');
    } catch {
      setServiceStatus('unavailable');
    }
  };

  const handleCompile = async () => {
    setCompiling(true);
    setError(null);
    setErrorLog(null);

    // Clean up previous PDF URL
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    try {
      const response = await fetch('/api/v1/services/latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_content: content,
          engine,
        }),
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error.message);
        setErrorLog(result.error.log || null);
        setPdfUrl(null);
        setPdfPath(null);
      } else if (result.pdf_path) {
        setPdfPath(result.pdf_path);
        // Fetch the PDF and create blob URL for preview
        await loadPdfPreview(result.pdf_path);
      }
    } catch (err) {
      setError((err as Error).message);
      setPdfUrl(null);
      setPdfPath(null);
    } finally {
      setCompiling(false);
    }
  };

  const loadPdfPreview = async (filePath: string) => {
    try {
      const response = await fetch(`/api/v1/files?path=${encodeURIComponent(filePath)}`);
      if (response.ok) {
        // Explicitly create blob with PDF mime type
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } else {
        const errorText = await response.text();
        console.error('[latex] PDF fetch error:', errorText);
        throw new Error('Failed to load PDF');
      }
    } catch (err) {
      console.error('[latex] PDF load error:', err);
      setError('PDF generated but failed to load preview');
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="flex h-full">
      {/* Editor Panel */}
      <div className="flex w-1/2 flex-col border-r border-border">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
          <Select value={engine} onValueChange={setEngine}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Engine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdflatex">pdflatex</SelectItem>
              <SelectItem value="xelatex">xelatex</SelectItem>
              <SelectItem value="lualatex">lualatex</SelectItem>
            </SelectContent>
          </Select>

          {/* Service status indicator */}
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                serviceStatus === 'available' ? 'bg-green-500' :
                serviceStatus === 'unavailable' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
              )}
            />
            <span className="text-xs text-muted-foreground">
              {serviceStatus === 'available' ? 'TeX Live Ready' :
               serviceStatus === 'unavailable' ? 'Offline' : 'Checking...'}
            </span>
          </div>

          <div className="flex-1" />

          <Button
            variant="default"
            size="sm"
            onClick={handleCompile}
            disabled={compiling || serviceStatus !== 'available'}
          >
            {compiling ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Compiling...
              </>
            ) : (
              <>
                <Play className="mr-1 h-4 w-4" />
                Compile PDF
              </>
            )}
          </Button>
        </div>

        {/* LaTeX Editor */}
        <div className="flex-1 overflow-hidden">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full min-h-full resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0"
            placeholder="Enter LaTeX code..."
            spellCheck={false}
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="border-t border-destructive/50 bg-destructive/10">
            <div className="flex items-start gap-2 p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-destructive" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-destructive">{error}</p>
                {errorLog && (
                  <ScrollArea className="mt-2 max-h-32">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{errorLog}</pre>
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Panel */}
      <div className="flex w-1/2 flex-col">
        {/* Preview Toolbar */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">PDF Preview</span>

          {pdfPath && (
            <span className="text-xs text-muted-foreground truncate max-w-48">
              {pdfPath}
            </span>
          )}

          <div className="flex-1" />

          {pdfUrl && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-1 h-4 w-4" />
              Download
            </Button>
          )}
        </div>

        {/* PDF Preview */}
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-900">
          {compiling ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Compiling with {engine}...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="h-full w-full"
              title="PDF Preview"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">Click "Compile PDF" to generate preview</p>
                {serviceStatus === 'unavailable' && (
                  <p className="mt-1 text-sm text-destructive">
                    LaTeX service is offline
                    <Button variant="link" size="sm" onClick={checkServiceStatus} className="ml-1 h-auto p-0">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Select components
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
