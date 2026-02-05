'use client';

import { useState } from 'react';
import { Play, RotateCcw, FileCode, Terminal as TerminalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const SAMPLE_CODE = `# Python example
import numpy as np
import matplotlib.pyplot as plt

# Generate some data
x = np.linspace(0, 2 * np.pi, 100)
y = np.sin(x)

# Print results
print("Generated", len(x), "data points")
print("Max value:", np.max(y))
print("Min value:", np.min(y))
`;

interface OutputLine {
  type: 'stdout' | 'stderr' | 'result';
  content: string;
  timestamp: string;
}

export default function CodePlayground() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState('python');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<OutputLine[]>([]);

  const handleRun = async () => {
    setRunning(true);
    setOutput([]);

    const startTime = Date.now();

    // Add running indicator
    setOutput([
      {
        type: 'stdout',
        content: '>>> Running code...\n',
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch('/api/v1/services/jupyter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          kernel: language === 'python' ? 'python3' : language,
        }),
      });

      const result = await response.json();

      if (result.error) {
        setOutput((prev) => [
          ...prev,
          {
            type: 'stderr',
            content: `Error: ${result.error.message}\n`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else if (result.outputs && result.outputs.length > 0) {
        // Process outputs from Jupyter
        const outputLines: OutputLine[] = result.outputs.map((output: {
          output_type: string;
          text?: string;
          ename?: string;
          evalue?: string;
          traceback?: string[];
          data?: Record<string, unknown>;
        }) => {
          if (output.output_type === 'stream') {
            return {
              type: 'stdout' as const,
              content: output.text || '',
              timestamp: new Date().toISOString(),
            };
          } else if (output.output_type === 'error') {
            const traceback = output.traceback?.join('\n') || '';
            return {
              type: 'stderr' as const,
              content: `${output.ename}: ${output.evalue}\n${traceback}\n`,
              timestamp: new Date().toISOString(),
            };
          } else if (output.output_type === 'execute_result' || output.output_type === 'display_data') {
            const text = output.data?.['text/plain'] as string || JSON.stringify(output.data);
            return {
              type: 'result' as const,
              content: text + '\n',
              timestamp: new Date().toISOString(),
            };
          }
          return {
            type: 'stdout' as const,
            content: JSON.stringify(output) + '\n',
            timestamp: new Date().toISOString(),
          };
        });

        setOutput((prev) => [...prev, ...outputLines]);
      } else {
        setOutput((prev) => [
          ...prev,
          {
            type: 'result',
            content: '(no output)\n',
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      setOutput((prev) => [
        ...prev,
        {
          type: 'result',
          content: `>>> Execution completed in ${elapsed}s`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setOutput((prev) => [
        ...prev,
        {
          type: 'stderr',
          content: `Network error: ${(err as Error).message}\n`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setRunning(false);
    }
  };

  const handleClear = () => {
    setOutput([]);
  };

  return (
    <div className="flex h-full">
      {/* Code Editor Panel */}
      <div className="flex w-1/2 flex-col border-r border-border">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
          </select>

          <div className="flex-1" />

          <Button variant="default" size="sm" onClick={handleRun} disabled={running}>
            <Play className={cn('mr-1 h-4 w-4', running && 'animate-pulse')} />
            {running ? 'Running...' : 'Run'}
          </Button>
        </div>

        {/* Code Input */}
        <div className="flex-1 overflow-hidden p-2">
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-full min-h-full resize-none font-mono text-sm"
            placeholder="Write your code here..."
            spellCheck={false}
          />
        </div>
      </div>

      {/* Output Panel */}
      <div className="flex w-1/2 flex-col">
        {/* Output Header */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
          <TerminalIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Output</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </div>

        {/* Output Content */}
        <ScrollArea className="flex-1 bg-zinc-950">
          <div className="p-4 font-mono text-sm">
            {output.length === 0 ? (
              <div className="text-zinc-500">
                <FileCode className="mb-2 h-8 w-8" />
                <p>Click Run to execute code</p>
              </div>
            ) : (
              output.map((line, index) => (
                <div
                  key={index}
                  className={cn(
                    'whitespace-pre-wrap',
                    line.type === 'stderr'
                      ? 'text-red-400'
                      : line.type === 'result'
                      ? 'text-green-400'
                      : 'text-zinc-300'
                  )}
                >
                  {line.content}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
