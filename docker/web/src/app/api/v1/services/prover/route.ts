import { NextRequest } from 'next/server';
import { services } from '@/lib/services';

export const runtime = 'nodejs';

/**
 * Prover Service API
 * Proxies requests to the internal Prover server (Z3/Coq)
 */

// POST /api/v1/services/prover - Run proof
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formula, code, prover = 'z3', timeout = 30000 } = body;

    const content = formula || code;
    if (!content) {
      return Response.json(
        { error: { code: 'INVALID_REQUEST', message: 'Formula or code is required' } },
        { status: 400 }
      );
    }

    // Route to appropriate prover endpoint
    let endpoint: string;
    let proverRequest: Record<string, unknown>;

    switch (prover) {
      case 'z3':
        endpoint = `${services.prover.url}/z3/solve`;
        proverRequest = { formula: content, timeout };
        break;
      case 'coq':
        endpoint = `${services.prover.url}/coq/check`;
        proverRequest = { code: content };
        break;
      case 'lean':
      case 'lean4':
        endpoint = `${services.prover.url}/lean/check`;
        proverRequest = { code: content };
        break;
      default:
        return Response.json(
          { error: { code: 'INVALID_PROVER', message: `Unknown prover: ${prover}` } },
          { status: 400 }
        );
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proverRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: { code: 'PROVER_ERROR', message: errorText } },
        { status: response.status }
      );
    }

    const result = await response.json();
    return Response.json(result);
  } catch (error) {
    console.error('[prover] Error:', error);

    if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
      return Response.json(
        { error: { code: 'SERVICE_UNAVAILABLE', message: 'Prover server is not running' } },
        { status: 503 }
      );
    }

    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

// GET /api/v1/services/prover - Get prover status
export async function GET() {
  try {
    const response = await fetch(`${services.prover.url}/status`);

    if (!response.ok) {
      return Response.json({
        status: 'unavailable',
        provers: {},
      });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('[prover] Status error:', error);
    return Response.json({
      status: 'unavailable',
      provers: {
        z3: { available: false },
        coq: { available: false },
        lean4: { available: false },
      },
    });
  }
}
