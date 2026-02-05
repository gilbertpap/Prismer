import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { services } from '@/lib/services';

export const runtime = 'nodejs';

const WORKSPACE = services.workspace;

// Ensure path is within workspace (security)
function resolveSafePath(requestPath: string): string | null {
  const resolved = path.resolve(WORKSPACE, requestPath.replace(/^\/+/, ''));
  if (!resolved.startsWith(WORKSPACE)) {
    return null;
  }
  return resolved;
}

/**
 * Files API - Read files and directories from workspace
 */

// GET /api/v1/files?path=/projects
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestPath = searchParams.get('path') || '/';

    const safePath = resolveSafePath(requestPath);
    if (!safePath) {
      return Response.json(
        { error: { code: 'INVALID_PATH', message: 'Path is outside workspace' } },
        { status: 400 }
      );
    }

    const stat = await fs.stat(safePath).catch(() => null);

    if (!stat) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Path not found' } },
        { status: 404 }
      );
    }

    if (stat.isDirectory()) {
      // List directory contents
      const entries = await fs.readdir(safePath, { withFileTypes: true });
      const items = await Promise.all(
        entries.map(async (entry) => {
          const entryPath = path.join(safePath, entry.name);
          const entryStat = await fs.stat(entryPath).catch(() => null);
          return {
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: entryStat?.size || 0,
            modified: entryStat?.mtime?.toISOString(),
          };
        })
      );

      return Response.json({
        path: requestPath,
        type: 'directory',
        items: items.sort((a, b) => {
          // Directories first, then alphabetically
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
      });
    } else {
      // Read file content
      const content = await fs.readFile(safePath);
      const ext = path.extname(safePath).toLowerCase();

      // Determine content type
      const textExtensions = ['.txt', '.md', '.tex', '.py', '.js', '.ts', '.json', '.yaml', '.yml', '.toml', '.sh', '.css', '.html'];
      const isText = textExtensions.includes(ext);

      if (isText) {
        return new Response(content, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-File-Path': requestPath,
          },
        });
      } else {
        // Binary file
        const mimeTypes: Record<string, string> = {
          '.pdf': 'application/pdf',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
        };
        return new Response(content, {
          headers: {
            'Content-Type': mimeTypes[ext] || 'application/octet-stream',
            'X-File-Path': requestPath,
          },
        });
      }
    }
  } catch (error) {
    console.error('[files] Error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

// POST /api/v1/files - Create/upload file
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // File upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const targetPath = formData.get('path') as string;

      if (!file || !targetPath) {
        return Response.json(
          { error: { code: 'INVALID_REQUEST', message: 'File and path are required' } },
          { status: 400 }
        );
      }

      const safePath = resolveSafePath(targetPath);
      if (!safePath) {
        return Response.json(
          { error: { code: 'INVALID_PATH', message: 'Path is outside workspace' } },
          { status: 400 }
        );
      }

      // Ensure parent directory exists
      await fs.mkdir(path.dirname(safePath), { recursive: true });

      // Write file
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(safePath, buffer);

      return Response.json({ success: true, path: targetPath });
    } else {
      // JSON body for text content
      const body = await request.json();
      const { path: targetPath, content } = body;

      if (!targetPath || content === undefined) {
        return Response.json(
          { error: { code: 'INVALID_REQUEST', message: 'Path and content are required' } },
          { status: 400 }
        );
      }

      const safePath = resolveSafePath(targetPath);
      if (!safePath) {
        return Response.json(
          { error: { code: 'INVALID_PATH', message: 'Path is outside workspace' } },
          { status: 400 }
        );
      }

      // Ensure parent directory exists
      await fs.mkdir(path.dirname(safePath), { recursive: true });

      // Write file
      await fs.writeFile(safePath, content, 'utf-8');

      return Response.json({ success: true, path: targetPath });
    }
  } catch (error) {
    console.error('[files] Write error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/files?path=/projects/old.txt
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestPath = searchParams.get('path');

    if (!requestPath) {
      return Response.json(
        { error: { code: 'INVALID_REQUEST', message: 'Path is required' } },
        { status: 400 }
      );
    }

    const safePath = resolveSafePath(requestPath);
    if (!safePath) {
      return Response.json(
        { error: { code: 'INVALID_PATH', message: 'Path is outside workspace' } },
        { status: 400 }
      );
    }

    const stat = await fs.stat(safePath).catch(() => null);
    if (!stat) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Path not found' } },
        { status: 404 }
      );
    }

    if (stat.isDirectory()) {
      await fs.rm(safePath, { recursive: true });
    } else {
      await fs.unlink(safePath);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[files] Delete error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
