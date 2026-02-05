// Runtime configuration

export interface RuntimeConfig {
  gatewayUrl: string;
  defaultProvider: 'anthropic' | 'openai' | 'google';
  defaultModel: string;
  features: {
    jupyterEnabled: boolean;
    latexEnabled: boolean;
    codePlaygroundEnabled: boolean;
    pdfReaderEnabled: boolean;
  };
}

export function getConfig(): RuntimeConfig {
  return {
    gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:18789',
    defaultProvider: (process.env.NEXT_PUBLIC_DEFAULT_PROVIDER || 'google') as RuntimeConfig['defaultProvider'],
    defaultModel: process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'gemini-2.5-flash',
    features: {
      jupyterEnabled: true,
      latexEnabled: true,
      codePlaygroundEnabled: true,
      pdfReaderEnabled: true,
    },
  };
}

// API base URL for server-side requests
export const API_BASE_URL = process.env.GATEWAY_URL || 'http://localhost:18789';

// Container API token for authentication
export const CONTAINER_API_TOKEN = process.env.CONTAINER_API_TOKEN || '';
