'use client';

import { useState, useCallback } from 'react';
import { Plus, Play, Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CellOutput {
  output_type: 'stream' | 'execute_result' | 'error' | 'display_data';
  name?: string;
  text?: string;
  data?: Record<string, unknown>;
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

interface Cell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  outputs: CellOutput[];
  status: 'idle' | 'running' | 'completed' | 'error';
  executionCount?: number;
}

export default function JupyterNotebook() {
  const [cells, setCells] = useState<Cell[]>([
    {
      id: nanoid(),
      type: 'code',
      content: '# Welcome to OpenPrismer Notebook\nimport numpy as np\nprint("Hello, Research!")',
      outputs: [],
      status: 'idle',
    },
  ]);
  const [activeCell, setActiveCell] = useState<string | null>(cells[0]?.id || null);
  const [kernel, setKernel] = useState('python3');

  const addCell = (type: 'code' | 'markdown', afterId?: string) => {
    const newCell: Cell = {
      id: nanoid(),
      type,
      content: '',
      outputs: [],
      status: 'idle',
    };

    setCells((prev) => {
      if (!afterId) return [...prev, newCell];
      const index = prev.findIndex((c) => c.id === afterId);
      return [...prev.slice(0, index + 1), newCell, ...prev.slice(index + 1)];
    });
    setActiveCell(newCell.id);
  };

  const updateCell = (id: string, content: string) => {
    setCells((prev) =>
      prev.map((cell) => (cell.id === id ? { ...cell, content } : cell))
    );
  };

  const deleteCell = (id: string) => {
    setCells((prev) => prev.filter((cell) => cell.id !== id));
  };

  const executeCell = useCallback(async (id: string) => {
    const cell = cells.find((c) => c.id === id);
    if (!cell || cell.type !== 'code') return;

    // Update status to running
    setCells((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'running', outputs: [] } : c
      )
    );

    try {
      const response = await fetch('/api/v1/services/jupyter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cell.content,
          kernel,
        }),
      });

      const result = await response.json();

      if (result.error) {
        setCells((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: 'error',
                  outputs: [
                    {
                      output_type: 'error',
                      ename: result.error.code,
                      evalue: result.error.message,
                    },
                  ],
                }
              : c
          )
        );
      } else {
        setCells((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: 'completed',
                  outputs: result.outputs || [],
                  executionCount: result.execution_count,
                }
              : c
          )
        );
      }
    } catch (error) {
      setCells((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: 'error',
                outputs: [
                  {
                    output_type: 'error',
                    ename: 'NetworkError',
                    evalue: (error as Error).message,
                  },
                ],
              }
            : c
        )
      );
    }
  }, [cells, kernel]);

  const runAllCells = async () => {
    for (const cell of cells) {
      if (cell.type === 'code') {
        await executeCell(cell.id);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
        <Button variant="outline" size="sm" onClick={() => addCell('code')}>
          <Plus className="mr-1 h-4 w-4" />
          Code
        </Button>
        <Button variant="outline" size="sm" onClick={() => addCell('markdown')}>
          <Plus className="mr-1 h-4 w-4" />
          Markdown
        </Button>

        <div className="h-6 w-px bg-border" />

        <select
          value={kernel}
          onChange={(e) => setKernel(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="python3">Python 3</option>
          <option value="ir">R</option>
        </select>

        <div className="flex-1" />

        <Button variant="default" size="sm" onClick={runAllCells}>
          <Play className="mr-1 h-4 w-4" />
          Run All
        </Button>
      </div>

      {/* Cells */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          <AnimatePresence>
            {cells.map((cell, index) => (
              <NotebookCell
                key={cell.id}
                cell={cell}
                index={index}
                isActive={cell.id === activeCell}
                onFocus={() => setActiveCell(cell.id)}
                onChange={(content) => updateCell(cell.id, content)}
                onExecute={() => executeCell(cell.id)}
                onDelete={() => deleteCell(cell.id)}
                onAddBelow={() => addCell('code', cell.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

interface NotebookCellProps {
  cell: Cell;
  index: number;
  isActive: boolean;
  onFocus: () => void;
  onChange: (content: string) => void;
  onExecute: () => void;
  onDelete: () => void;
  onAddBelow: () => void;
}

function NotebookCell({
  cell,
  index,
  isActive,
  onFocus,
  onChange,
  onExecute,
  onDelete,
  onAddBelow,
}: NotebookCellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'group rounded-lg border bg-card transition-shadow',
        isActive && 'ring-2 ring-primary'
      )}
      onClick={onFocus}
    >
      {/* Cell header */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        <span className="text-xs text-muted-foreground">
          [{cell.executionCount ?? index + 1}] {cell.type}
        </span>

        <div className="flex-1" />

        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {cell.type === 'code' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onExecute();
              }}
              disabled={cell.status === 'running'}
            >
              {cell.status === 'running' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onAddBelow();
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {cell.status === 'running' && (
          <span className="text-xs text-amber-500">Running...</span>
        )}
        {cell.status === 'error' && (
          <span className="text-xs text-destructive">Error</span>
        )}
      </div>

      {/* Cell content */}
      {!collapsed && (
        <div className="p-3">
          <Textarea
            value={cell.content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={cell.type === 'code' ? '# Enter code...' : 'Enter markdown...'}
            className="min-h-[100px] resize-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                onExecute();
              }
            }}
          />

          {/* Outputs */}
          {cell.outputs.length > 0 && (
            <div className="mt-2 space-y-2">
              {cell.outputs.map((output, i) => (
                <CellOutputView key={i} output={output} />
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function CellOutputView({ output }: { output: CellOutput }) {
  if (output.output_type === 'error') {
    return (
      <div className="rounded border border-destructive/50 bg-destructive/10 p-3">
        <div className="font-mono text-sm text-destructive">
          <strong>{output.ename}</strong>: {output.evalue}
        </div>
        {output.traceback && (
          <pre className="mt-2 overflow-x-auto text-xs text-destructive/80">
            {output.traceback.join('\n')}
          </pre>
        )}
      </div>
    );
  }

  if (output.output_type === 'stream') {
    return (
      <pre className="rounded border border-border bg-muted/50 p-3 font-mono text-sm">
        {output.text}
      </pre>
    );
  }

  if (output.output_type === 'execute_result' || output.output_type === 'display_data') {
    if (output.data?.['text/plain']) {
      return (
        <pre className="rounded border border-border bg-muted/50 p-3 font-mono text-sm">
          {output.data['text/plain'] as string}
        </pre>
      );
    }
  }

  return (
    <pre className="rounded border border-border bg-muted/50 p-3 font-mono text-sm">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}
