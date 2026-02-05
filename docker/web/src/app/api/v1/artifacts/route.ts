import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const OUTPUT_DIR = '/workspace/output';

interface Artifact {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size: number;
  modified: string;
  mimeType?: string;
  preview?: boolean;
}

// Map file extensions to MIME types and preview capability
const FILE_TYPES: Record<string, { mime: string; preview: boolean }> = {
  '.pdf': { mime: 'application/pdf', preview: true },
  '.png': { mime: 'image/png', preview: true },
  '.jpg': { mime: 'image/jpeg', preview: true },
  '.jpeg': { mime: 'image/jpeg', preview: true },
  '.gif': { mime: 'image/gif', preview: true },
  '.svg': { mime: 'image/svg+xml', preview: true },
  '.csv': { mime: 'text/csv', preview: true },
  '.json': { mime: 'application/json', preview: true },
  '.txt': { mime: 'text/plain', preview: true },
  '.md': { mime: 'text/markdown', preview: true },
  '.tex': { mime: 'application/x-tex', preview: true },
  '.py': { mime: 'text/x-python', preview: true },
  '.ipynb': { mime: 'application/x-ipynb+json', preview: true },
};

/**
 * Artifacts API - List and access generated outputs
 */

// GET /api/v1/artifacts - List all artifacts in output directory
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subPath = searchParams.get('path') || '/';
    const recursive = searchParams.get('recursive') === 'true';

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Resolve path safely
    const targetPath = path.resolve(OUTPUT_DIR, subPath.replace(/^\/+/, ''));
    if (!targetPath.startsWith(OUTPUT_DIR)) {
      return Response.json(
        { error: { code: 'INVALID_PATH', message: 'Path is outside output directory' } },
        { status: 400 }
      );
    }

    const stat = await fs.stat(targetPath).catch(() => null);
    if (!stat || !stat.isDirectory()) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Directory not found' } },
        { status: 404 }
      );
    }

    const artifacts = await listArtifacts(targetPath, OUTPUT_DIR, recursive);

    // Sort: directories first, then by modified time (newest first)
    artifacts.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return new Date(b.modified).getTime() - new Date(a.modified).getTime();
    });

    return Response.json({
      path: subPath,
      artifacts,
      total: artifacts.length,
    });
  } catch (error) {
    console.error('[artifacts] Error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

async function listArtifacts(
  dirPath: string,
  baseDir: string,
  recursive: boolean
): Promise<Artifact[]> {
  const artifacts: Artifact[] = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    // Skip hidden files
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dirPath, entry.name);
    // Return paths relative to /workspace/ (not /workspace/output/) for consistency with Files API
    const relativePath = '/output/' + path.relative(baseDir, fullPath);
    const stat = await fs.stat(fullPath).catch(() => null);

    if (!stat) continue;

    if (entry.isDirectory()) {
      artifacts.push({
        name: entry.name,
        type: 'directory',
        path: relativePath,
        size: 0,
        modified: stat.mtime.toISOString(),
      });

      if (recursive) {
        const subArtifacts = await listArtifacts(fullPath, baseDir, true);
        artifacts.push(...subArtifacts);
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      const fileType = FILE_TYPES[ext];

      artifacts.push({
        name: entry.name,
        type: 'file',
        path: relativePath,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        mimeType: fileType?.mime || 'application/octet-stream',
        preview: fileType?.preview || false,
      });
    }
  }

  return artifacts;
}

// DELETE /api/v1/artifacts?path=/file.pdf - Delete an artifact
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path');

    if (!filePath) {
      return Response.json(
        { error: { code: 'INVALID_REQUEST', message: 'Path is required' } },
        { status: 400 }
      );
    }

    // Resolve path safely
    const targetPath = path.resolve(OUTPUT_DIR, filePath.replace(/^\/+/, ''));
    if (!targetPath.startsWith(OUTPUT_DIR)) {
      return Response.json(
        { error: { code: 'INVALID_PATH', message: 'Path is outside output directory' } },
        { status: 400 }
      );
    }

    const stat = await fs.stat(targetPath).catch(() => null);
    if (!stat) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Artifact not found' } },
        { status: 404 }
      );
    }

    if (stat.isDirectory()) {
      await fs.rm(targetPath, { recursive: true });
    } else {
      await fs.unlink(targetPath);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[artifacts] Delete error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
