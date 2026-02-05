// Container service configuration
// These are internal container URLs, only accessible from server-side
// Use getters to ensure environment variables are read at runtime, not build time

export const services = {
  // OpenClaw Gateway - Agent communication
  gateway: {
    get url() { return process.env.GATEWAY_URL || 'http://127.0.0.1:18900'; },
    get token() { return process.env.GATEWAY_TOKEN || ''; },
  },

  // Jupyter Server - Code execution
  jupyter: {
    get url() { return process.env.JUPYTER_URL || 'http://127.0.0.1:8888'; },
    get token() { return process.env.JUPYTER_TOKEN || ''; },
  },

  // LaTeX Server - Document compilation
  latex: {
    get url() { return process.env.LATEX_URL || 'http://127.0.0.1:8080'; },
  },

  // Prover Server - Z3/Coq verification
  prover: {
    get url() { return process.env.PROVER_URL || 'http://127.0.0.1:8081'; },
  },

  // Workspace path
  get workspace() { return process.env.WORKSPACE_PATH || '/workspace'; },
};

// Helper to get auth headers for gateway
export function getGatewayHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (services.gateway.token) {
    headers['Authorization'] = `Bearer ${services.gateway.token}`;
  }

  return headers;
}

// Helper to get auth headers for jupyter
export function getJupyterHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (services.jupyter.token) {
    headers['Authorization'] = `token ${services.jupyter.token}`;
  }

  return headers;
}
