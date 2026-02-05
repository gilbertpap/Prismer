import { NextRequest } from 'next/server';
import { services } from '@/lib/services';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

const OUTPUT_DIR = '/workspace/output';

/**
 * LaTeX Service API
 * Compiles LaTeX to PDF using the container's TeX Live installation
 */

// POST /api/v1/services/latex - Compile LaTeX
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source_content, engine = 'pdflatex', filename } = body;

    if (!source_content) {
      return Response.json(
        { error: { code: 'INVALID_REQUEST', message: 'source_content is required' } },
        { status: 400 }
      );
    }

    // Call the internal LaTeX server
    const response = await fetch(`${services.latex.url}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: source_content,
        engine,
      }),
    });

    // LaTeX server always returns JSON
    const result = await response.json();

    // Check for errors
    if (!response.ok || result.error || !result.success) {
      return Response.json(
        {
          error: {
            code: 'LATEX_ERROR',
            message: result.error || 'Compilation failed',
            log: result.log || null
          }
        },
        { status: 400 }
      );
    }

    // LaTeX server returns JSON with pdf_path pointing to compiled PDF
    const serverPdfPath = result.pdf_path;
    if (!serverPdfPath) {
      return Response.json(
        { error: { code: 'LATEX_ERROR', message: 'No PDF path returned from server' } },
        { status: 500 }
      );
    }

    // Read the PDF from server's output location
    const pdfBuffer = await fs.readFile(serverPdfPath);

    // Generate output filename for our workspace
    const outputFilename = filename || `document_${nanoid(6)}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Copy PDF to workspace output directory
    await fs.writeFile(outputPath, pdfBuffer);

    // Return the path (relative to /workspace/)
    return Response.json({
      success: true,
      pdf_path: `/output/${outputFilename}`,
      filename: outputFilename,
      size: pdfBuffer.byteLength,
      log: result.log,
    });
  } catch (error) {
    console.error('[latex] Error:', error);

    if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
      return Response.json(
        { error: { code: 'SERVICE_UNAVAILABLE', message: 'LaTeX server is not running. Please check container status.' } },
        { status: 503 }
      );
    }

    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

// GET /api/v1/services/latex - Get available engines
export async function GET() {
  try {
    const response = await fetch(`${services.latex.url}/templates`);

    if (response.ok) {
      const data = await response.json();
      return Response.json({
        engines: data.engines || ['pdflatex', 'xelatex', 'lualatex'],
        templates: data.templates || ['article', 'article-zh', 'beamer', 'ieee'],
        status: 'available',
      });
    }
  } catch (error) {
    console.error('[latex] Status error:', error);
  }

  // Return defaults if server unavailable
  return Response.json({
    engines: ['pdflatex', 'xelatex', 'lualatex'],
    templates: ['article', 'report', 'beamer'],
    status: 'unavailable',
  });
}
