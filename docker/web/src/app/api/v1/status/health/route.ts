export const runtime = 'nodejs';

/**
 * Health check endpoint for Kubernetes/Docker health probes
 * Returns 200 if the frontend is running
 * Returns 503 if critical services are down
 */
export async function GET() {
  // Check if OpenClaw CLI is available and gateway is running
  let gatewayHealthy = false;

  try {
    const { execSync } = await import('child_process');
    const result = execSync('openclaw gateway health', {
      timeout: 5000,
      encoding: 'utf-8',
      env: {
        ...process.env,
        HOME: '/home/user',
        OPENCLAW_HOME: '/workspace/.openclaw',
      },
    });
    gatewayHealthy = result.includes('OK');
  } catch {
    gatewayHealthy = false;
  }

  // In development mode, consider healthy even without gateway
  const isDev = process.env.NODE_ENV === 'development';

  if (gatewayHealthy || isDev) {
    return Response.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        gateway: gatewayHealthy ? 'connected' : 'unavailable (dev mode)',
      },
      { status: 200 }
    );
  }

  return Response.json(
    {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      reason: 'Gateway unavailable',
    },
    { status: 503 }
  );
}
