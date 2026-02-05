import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// UI Directive regex - matches [[UI:type:payload]]
const DIRECTIVE_REGEX = /\[\[UI:(\w+):([^\]]+)\]\]/g;

// File path patterns to auto-detect artifacts (any file in /workspace/)
const ARTIFACT_PATH_REGEX = /\/workspace\/(?:output\/)?[^\s"'<>\n]+\.(pdf|png|jpg|jpeg|gif|svg|csv|json|tex|py|ipynb|md|txt)/gi;

interface UIDirective {
  type: string;
  payload: string;
}

/**
 * Parse UI directives from text and return clean text + directives
 */
function parseDirectives(text: string): { cleanText: string; directives: UIDirective[] } {
  const directives: UIDirective[] = [];

  // Extract explicit directives
  const cleanText = text.replace(DIRECTIVE_REGEX, (_, type, payload) => {
    directives.push({ type, payload });
    return '';
  });

  // Auto-detect artifact file paths and create show_artifact directives
  const seenPaths = new Set<string>();
  let match: RegExpExecArray | null;
  ARTIFACT_PATH_REGEX.lastIndex = 0;

  while ((match = ARTIFACT_PATH_REGEX.exec(text)) !== null) {
    const filePath = match[0];
    if (!seenPaths.has(filePath)) {
      seenPaths.add(filePath);
      // Convert absolute path to relative from /workspace/
      // Use 'open_file' directive with full workspace-relative path
      const relativePath = filePath.replace('/workspace', '');
      directives.push({ type: 'open_file', payload: relativePath });
    }
  }

  return { cleanText: cleanText.trim(), directives };
}

// Map frontend provider names to OpenClaw provider/model format
function resolveModel(provider: string, model: string): string {
  if (model.includes('/')) {
    return model;
  }

  const providerMap: Record<string, string> = {
    google: 'google',
    anthropic: 'anthropic',
    openai: 'openai',
    venice: 'venice',
    openrouter: 'openrouter',
  };

  const prefix = providerMap[provider] || provider;
  return `${prefix}/${model}`;
}

// Map provider to environment variable name (OpenClaw specific)
function getApiKeyEnvName(provider: string): string {
  const envMap: Record<string, string> = {
    google: 'GEMINI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    venice: 'VENICE_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    groq: 'GROQ_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
  };
  return envMap[provider] || `${provider.toUpperCase()}_API_KEY`;
}

/**
 * Chat API - Calls OpenClaw agent via CLI
 * Parses UI directives and sends them as SSE events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, content, stream = true, config } = body;

    if (!content) {
      return Response.json(
        { error: { code: 'INVALID_REQUEST', message: 'Content is required' } },
        { status: 400 }
      );
    }

    const apiKey = config?.api_key;
    const provider = config?.provider || 'google';
    const model = config?.model || 'gemini-2.5-flash';

    if (!apiKey) {
      return Response.json(
        { error: { code: 'NO_API_KEY', message: 'Please configure your API key in settings' } },
        { status: 400 }
      );
    }

    const envKeyName = getApiKeyEnvName(provider);
    const resolvedModel = resolveModel(provider, model);

    const procEnv = {
      ...process.env,
      HOME: '/home/user',
      OPENCLAW_HOME: '/workspace/.openclaw',
      [envKeyName]: apiKey,
      OPENCLAW_API_KEY: apiKey,
    };

    const { spawn } = await import('child_process');

    const args = ['agent', '--local'];

    if (session_id) {
      args.push('--session-id', session_id);
    } else {
      args.push('--to', '+10000000000');
    }

    args.push('--message', content);

    if (stream) {
      const encoder = new TextEncoder();

      // Buffer to accumulate text for directive detection
      let fullOutput = '';
      const sentDirectives = new Set<string>();

      const readableStream = new ReadableStream({
        start(controller) {
          const proc = spawn('openclaw', args, {
            cwd: '/workspace',
            env: procEnv,
          });

          proc.stdout.on('data', (data: Buffer) => {
            const text = data.toString();
            fullOutput += text;

            // Parse for directives
            const { cleanText, directives } = parseDirectives(text);

            // Send content (without directive markers)
            if (cleanText) {
              const contentEvent = `data: ${JSON.stringify({
                type: 'content_delta',
                data: { content: cleanText }
              })}\n\n`;
              controller.enqueue(encoder.encode(contentEvent));
            }

            // Send any new directives
            for (const directive of directives) {
              const key = `${directive.type}:${directive.payload}`;
              if (!sentDirectives.has(key)) {
                sentDirectives.add(key);
                const directiveEvent = `data: ${JSON.stringify({
                  type: 'ui_directive',
                  data: directive
                })}\n\n`;
                controller.enqueue(encoder.encode(directiveEvent));
              }
            }
          });

          proc.stderr.on('data', (data: Buffer) => {
            const text = data.toString();
            console.log('[openclaw stderr]', text);

            if (text.includes('No API key found')) {
              const errorEvent = `data: ${JSON.stringify({
                type: 'error',
                data: { error: 'API key not recognized. Please check your API key and provider settings.' }
              })}\n\n`;
              controller.enqueue(encoder.encode(errorEvent));
            }
          });

          proc.on('close', (code) => {
            // Final pass: check for any remaining directives in full output
            const { directives: finalDirectives } = parseDirectives(fullOutput);
            for (const directive of finalDirectives) {
              const key = `${directive.type}:${directive.payload}`;
              if (!sentDirectives.has(key)) {
                sentDirectives.add(key);
                const directiveEvent = `data: ${JSON.stringify({
                  type: 'ui_directive',
                  data: directive
                })}\n\n`;
                controller.enqueue(encoder.encode(directiveEvent));
              }
            }

            // If artifacts were detected, send refresh directive
            if (sentDirectives.size > 0) {
              const refreshEvent = `data: ${JSON.stringify({
                type: 'ui_directive',
                data: { type: 'refresh_artifacts', payload: '' }
              })}\n\n`;
              controller.enqueue(encoder.encode(refreshEvent));
            }

            if (code !== 0) {
              const errorEvent = `data: ${JSON.stringify({
                type: 'error',
                data: { error: `Agent exited with code ${code}` }
              })}\n\n`;
              controller.enqueue(encoder.encode(errorEvent));
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          });

          proc.on('error', (err) => {
            const errorEvent = `data: ${JSON.stringify({
              type: 'error',
              data: { error: err.message }
            })}\n\n`;
            controller.enqueue(encoder.encode(errorEvent));
            controller.close();
          });
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    } else {
      return new Promise<Response>((resolve) => {
        const proc = spawn('openclaw', args, {
          cwd: '/workspace',
          env: procEnv,
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        proc.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        proc.on('close', (code) => {
          if (code !== 0) {
            resolve(Response.json(
              { error: { code: 'AGENT_ERROR', message: stderr || `Process exited with code ${code}` } },
              { status: 500 }
            ));
          } else {
            const { cleanText, directives } = parseDirectives(stdout);
            resolve(Response.json({
              content: cleanText,
              session_id,
              directives,
            }));
          }
        });

        proc.on('error', (err) => {
          resolve(Response.json(
            { error: { code: 'SPAWN_ERROR', message: err.message } },
            { status: 500 }
          ));
        });
      });
    }
  } catch (error) {
    console.error('[chat] Error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
