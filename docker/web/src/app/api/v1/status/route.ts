import { services, getJupyterHeaders } from '@/lib/services';

export const runtime = 'nodejs';

interface ServiceStatus {
  status: 'running' | 'unavailable' | 'error';
  port: number;
  error?: string;
}

async function checkService(url: string, headers?: Record<string, string>): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkGateway(): Promise<boolean> {
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
    return result.includes('OK');
  } catch {
    return false;
  }
}

/**
 * Status API - Check all container services
 */
export async function GET() {
  const startTime = Date.now();

  // Check all services in parallel
  const [gatewayOk, jupyterOk, latexOk, proverOk] = await Promise.all([
    checkGateway(),
    checkService(`${services.jupyter.url}/api/status`, getJupyterHeaders()),
    checkService(`${services.latex.url}/health`),
    checkService(`${services.prover.url}/health`),
  ]);

  const serviceStatuses: Record<string, ServiceStatus> = {
    gateway: {
      status: gatewayOk ? 'running' : 'unavailable',
      port: 18900,
    },
    jupyter: {
      status: jupyterOk ? 'running' : 'unavailable',
      port: 8888,
    },
    latex: {
      status: latexOk ? 'running' : 'unavailable',
      port: 8080,
    },
    prover: {
      status: proverOk ? 'running' : 'unavailable',
      port: 8081,
    },
  };

  // Agent info from config
  const agentInfo = {
    model: 'openclaw/local',
    sessions_active: 0,
    requests_handled: 0,
  };

  return Response.json({
    container: {
      version: process.env.npm_package_version || '1.0.0',
      uptime_seconds: Math.floor(process.uptime()),
      started_at: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    },
    identity: {
      workspace_id: process.env.WORKSPACE_ID || 'local',
      agent_instance_id: process.env.AGENT_INSTANCE_ID || 'local-agent',
    },
    services: serviceStatuses,
    agent: agentInfo,
    check_duration_ms: Date.now() - startTime,
  });
}
