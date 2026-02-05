'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SiriOrb } from '@/components/ui/siri-orb';
import { useConfig } from '@/stores/workspaceStore';

type Provider = 'venice' | 'openrouter' | 'anthropic' | 'openai' | 'google' | 'moonshot' | 'qwen-portal' | 'zai' | 'xiaomi' | 'ollama';

interface ProviderConfig {
  id: Provider;
  name: string;
  models: { id: string; name: string; context?: string }[];
  keyPrefix: string;
  placeholder: string;
  description: string;
}

const providers: ProviderConfig[] = [
  {
    id: 'venice',
    name: 'Venice AI',
    description: 'Privacy-focused, supports anonymized models',
    keyPrefix: 'vapi_',
    placeholder: 'vapi_xxxxxxxxxxxx',
    models: [
      // Anonymized models (recommended for most use cases)
      { id: 'venice/claude-opus-45', name: 'Claude Opus 4.5 (Anon)', context: '202k' },
      { id: 'venice/claude-sonnet-45', name: 'Claude Sonnet 4.5 (Anon)', context: '202k' },
      { id: 'venice/openai-gpt-52', name: 'GPT-5.2 (Anon)', context: '262k' },
      { id: 'venice/openai-gpt-52-codex', name: 'GPT-5.2 Codex (Anon)', context: '262k' },
      { id: 'venice/gemini-3-pro-preview', name: 'Gemini 3 Pro (Anon)', context: '202k' },
      { id: 'venice/gemini-3-flash-preview', name: 'Gemini 3 Flash (Anon)', context: '262k' },
      { id: 'venice/grok-41-fast', name: 'Grok 4.1 Fast (Anon)', context: '262k' },
      { id: 'venice/kimi-k2-thinking', name: 'Kimi K2 Thinking (Anon)', context: '262k' },
      { id: 'venice/minimax-m21', name: 'MiniMax M2.1 (Anon)', context: '202k' },
      // Private models
      { id: 'venice/llama-3.3-70b', name: 'LLaMA 3.3 70B', context: '131k' },
      { id: 'venice/qwen3-235b-a22b-thinking-2507', name: 'Qwen3 235B Thinking', context: '131k' },
      { id: 'venice/qwen3-coder-480b-a35b-instruct', name: 'Qwen3 Coder 480B', context: '262k' },
      { id: 'venice/deepseek-v3.2', name: 'DeepSeek V3.2', context: '163k' },
      { id: 'venice/hermes-3-llama-3.1-405b', name: 'Hermes 3 LLaMA 405B', context: '131k' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Unified API for multiple providers',
    keyPrefix: 'sk-or-',
    placeholder: 'sk-or-xxxxxxxxxxxx',
    models: [
      { id: 'openrouter/anthropic/claude-opus-4-5', name: 'Claude Opus 4.5' },
      { id: 'openrouter/anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
      { id: 'openrouter/openai/gpt-5.2', name: 'GPT-5.2' },
      { id: 'openrouter/google/gemini-3-pro', name: 'Gemini 3 Pro' },
      { id: 'openrouter/meta-llama/llama-3.3-70b', name: 'LLaMA 3.3 70B' },
      { id: 'openrouter/deepseek/deepseek-v3', name: 'DeepSeek V3' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Direct Anthropic API access',
    keyPrefix: 'sk-ant-',
    placeholder: 'sk-ant-xxxxxxxxxxxx',
    models: [
      { id: 'anthropic/claude-opus-4-5', name: 'Claude Opus 4.5' },
      { id: 'anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
      { id: 'anthropic/claude-3-5-haiku', name: 'Claude 3.5 Haiku' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Direct OpenAI API access',
    keyPrefix: 'sk-',
    placeholder: 'sk-proj-xxxxxxxxxxxx',
    models: [
      { id: 'openai/gpt-5.2', name: 'GPT-5.2' },
      { id: 'openai/gpt-4o', name: 'GPT-4o' },
      { id: 'openai/o3', name: 'o3' },
      { id: 'openai/o3-mini', name: 'o3-mini' },
    ],
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Google Gemini models',
    keyPrefix: 'AIza',
    placeholder: 'AIzaSyxxxxxxxxxx',
    models: [
      { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
      { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    ],
  },
  {
    id: 'moonshot',
    name: 'Moonshot/Kimi',
    description: 'Kimi K2 models with 256k context',
    keyPrefix: '',
    placeholder: 'your-moonshot-api-key',
    models: [
      { id: 'moonshot/kimi-k2.5', name: 'Kimi K2.5', context: '256k' },
      { id: 'moonshot/kimi-k2-thinking', name: 'Kimi K2 Thinking', context: '256k' },
      { id: 'moonshot/kimi-k2-thinking-turbo', name: 'Kimi K2 Thinking Turbo', context: '256k' },
      { id: 'moonshot/kimi-k2-turbo-preview', name: 'Kimi K2 Turbo', context: '256k' },
    ],
  },
  {
    id: 'qwen-portal',
    name: 'Qwen Portal',
    description: 'Free tier with OAuth (2000 req/day)',
    keyPrefix: '',
    placeholder: 'OAuth authentication',
    models: [
      { id: 'qwen-portal/coder-model', name: 'Qwen Coder' },
      { id: 'qwen-portal/vision-model', name: 'Qwen Vision' },
    ],
  },
  {
    id: 'zai',
    name: 'Z.AI / GLM',
    description: 'GLM models from Z.AI',
    keyPrefix: 'sk-',
    placeholder: 'sk-xxxxxxxxxxxx',
    models: [
      { id: 'zai/glm-4.7', name: 'GLM-4.7' },
      { id: 'zai/glm-4.6', name: 'GLM-4.6' },
    ],
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi MiMo',
    description: 'MiMo models with 262k context',
    keyPrefix: '',
    placeholder: 'your-xiaomi-api-key',
    models: [
      { id: 'xiaomi/mimo-v2-flash', name: 'MiMo V2 Flash', context: '262k' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Run models locally',
    keyPrefix: '',
    placeholder: 'ollama (no key required)',
    models: [
      { id: 'ollama/llama3.3', name: 'LLaMA 3.3' },
      { id: 'ollama/qwen2.5-coder:32b', name: 'Qwen 2.5 Coder 32B' },
      { id: 'ollama/deepseek-r1:32b', name: 'DeepSeek R1 32B' },
      { id: 'ollama/mistral', name: 'Mistral' },
    ],
  },
];

interface APIKeyFormProps {
  onSuccess?: () => void;
}

export function APIKeyForm({ onSuccess }: APIKeyFormProps) {
  const { setConfig } = useConfig();
  const [provider, setProvider] = useState<Provider>('venice');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(providers[0].models[0].id);
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const currentProvider = providers.find((p) => p.id === provider)!;

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    const newProviderConfig = providers.find((p) => p.id === newProvider)!;
    setModel(newProviderConfig.models[0].id);
    setError(null);
  };

  const handleValidate = async () => {
    // Ollama doesn't require API key
    if (provider !== 'ollama' && !apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      // Try to validate the API key by calling the status endpoint
      await fetch('/api/v1/status/health');

      // For now, just accept any key since we're in development
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
      setConfig({ apiKey: apiKey || 'ollama-local', provider, model });

      setTimeout(() => {
        onSuccess?.();
      }, 500);
    } catch (err) {
      setError('Failed to validate API key. Please check and try again.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg"
    >
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <SiriOrb size={64} status={success ? 'active' : 'idle'} />
          </div>
          <CardTitle className="text-2xl">Welcome to OpenPrismer</CardTitle>
          <CardDescription>
            Configure your AI provider to get started with your research assistant.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Provider</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {providers.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`rounded-lg border-2 p-2 text-left transition-all ${
                    provider === p.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <span className="block text-sm font-medium">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">{p.description}</span>
                </button>
              ))}
            </div>
            {/* More providers */}
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                More providers...
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {providers.slice(6).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderChange(p.id)}
                    className={`rounded-lg border-2 p-2 text-left transition-all ${
                      provider === p.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <span className="block text-sm font-medium">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{p.description}</span>
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* API Key Input */}
          {provider !== 'ollama' && provider !== 'qwen-portal' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError(null);
                  }}
                  placeholder={currentProvider.placeholder}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {provider === 'qwen-portal' && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
              Qwen Portal uses OAuth authentication. You will be prompted to login after clicking Start.
            </div>
          )}

          {provider === 'ollama' && (
            <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-3 text-sm">
              Ollama runs locally. Make sure Ollama is running at <code className="rounded bg-muted px-1">localhost:11434</code>
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {currentProvider.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.context && `(${m.context})`}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4" />
              {error}
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-green-600"
            >
              <CheckCircle2 className="h-4 w-4" />
              Configuration saved! Redirecting...
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleValidate}
            disabled={validating || success}
            className="w-full"
            size="lg"
          >
            {validating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Success!
              </>
            ) : (
              'Start Using OpenPrismer'
            )}
          </Button>

          {/* Help Text */}
          <p className="text-center text-xs text-muted-foreground">
            Your API key is stored locally and never sent to our servers.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
