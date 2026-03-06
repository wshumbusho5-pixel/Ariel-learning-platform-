'use client';

import { useEffect, useMemo, useState } from 'react';
import { aiCredentialsAPI } from '@/lib/api';
import { clearLocalAICredentials, loadLocalAICredentials, saveLocalAICredentials } from '@/lib/aiCredentials';
import { useAuth } from '@/lib/useAuth';

type Provider = 'openai' | 'anthropic' | 'ollama';

const providerOptions: { id: Provider; label: string; helper: string; cta?: string; link?: string; keyHint?: string }[] = [
  { id: 'openai', label: 'OpenAI', helper: 'Fast, strong reasoning', cta: 'Get key', link: 'https://platform.openai.com/settings/organization/api-keys', keyHint: 'Starts with sk-' },
  { id: 'anthropic', label: 'Anthropic Claude', helper: 'Great for longer thinking', cta: 'Get key', link: 'https://console.anthropic.com/settings/keys', keyHint: 'Starts with sk-ant-' },
  { id: 'ollama', label: 'Ariel built-in (Ollama)', helper: 'No key needed; on-device/fallback' },
];

const defaultModel = (provider: Provider) => {
  if (provider === 'openai') return 'gpt-4o-mini';
  if (provider === 'anthropic') return 'claude-3-5-sonnet-20241022';
  return 'llama3.2:3b';
};

export default function AIProviderSettings() {
  const { isAuthenticated } = useAuth();
  const [provider, setProvider] = useState<Provider>('ollama');
  const [model, setModel] = useState<string>(defaultModel('ollama'));
  const [apiKey, setApiKey] = useState('');
  const [rememberLocal, setRememberLocal] = useState(true);
  const [saveToAccount, setSaveToAccount] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverHasKey, setServerHasKey] = useState(false);
  const [serverProvider, setServerProvider] = useState<string | null>(null);
  const [serverModel, setServerModel] = useState<string | null>(null);
  const [mode, setMode] = useState<'built-in' | 'bring-your-own'>('built-in');

  useEffect(() => {
    const local = loadLocalAICredentials();
    if (local?.provider) {
      setProvider(local.provider);
      setModel(local.model || defaultModel(local.provider));
      setApiKey(local.apiKey || '');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setServerHasKey(false);
      setServerProvider(null);
      setServerModel(null);
      return;
    }

    const fetchSettings = async () => {
      try {
        const res = await aiCredentialsAPI.get();
        setServerHasKey(!!res?.has_api_key);
        setServerProvider(res?.provider || null);
        setServerModel(res?.model || null);
        // If no local preference, align UI to saved provider/model
        const local = loadLocalAICredentials();
        if (!local && res?.provider) {
          setProvider(res.provider as Provider);
          setModel(res?.model || defaultModel(res.provider as Provider));
        }
      } catch {
        // ignore
      }
    };

    fetchSettings();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!model) {
      setModel(defaultModel(provider));
    }
  }, [provider, model]);

  const providerSummary = useMemo(() => {
    if (serverHasKey && serverProvider) {
      return `Using your saved ${serverProvider} key${serverModel ? ` (${serverModel})` : ''} on the backend.`;
    }
    return 'No saved backend key. Using local preference or Ollama fallback.';
  }, [serverHasKey, serverProvider, serverModel]);

  const handleSave = async () => {
    if (mode === 'built-in') {
      // Clear local key to force Ollama/built-in
      clearLocalAICredentials();
      setStatus('Using Ariel built-in AI. You can switch to your own key anytime.');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      if (rememberLocal) {
        saveLocalAICredentials({
          provider,
          apiKey: apiKey || undefined,
          model: model || undefined,
        });
      } else {
        clearLocalAICredentials();
      }

      if (saveToAccount) {
        if (!isAuthenticated) {
          setStatus('Sign in to save your key to your account.');
          setLoading(false);
          return;
        }

        await aiCredentialsAPI.save({
          provider,
          model: model || undefined,
          api_key: apiKey || undefined,
        });
        setServerHasKey(!!apiKey);
        setServerProvider(provider);
        setServerModel(model || null);
      }

      const using = apiKey
        ? `Using ${provider} (${model || 'default model'})`
        : 'Saved preference. Ollama or stored backend key will be used.';
      setStatus(using);
      if (!rememberLocal && !saveToAccount) {
        setStatus('Preference updated for this session.');
      }
    } catch (error: any) {
      setStatus(error?.response?.data?.detail || 'Failed to save AI settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLocal = () => {
    clearLocalAICredentials();
    setApiKey('');
    setStatus('Cleared local key. Backend or Ollama will be used.');
  };

  const handleRemoveBackendKey = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      await aiCredentialsAPI.save({ remove_key: true });
      setServerHasKey(false);
      setStatus('Removed saved backend key. Using local/headers or Ollama.');
    } catch {
      setStatus('Could not remove saved key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Bring Your Own AI</p>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Use your own OpenAI or Claude key</h2>
          <p className="text-sm text-gray-600">{providerSummary}</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
          Keys stay encrypted; only sent when you call AI.
        </div>
      </div>

      {/* Mode switch */}
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setMode('built-in')}
          className={`rounded-2xl border p-4 text-left transition-colors ${mode === 'built-in' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-900">Use Ariel built-in (Ollama)</div>
            {mode === 'built-in' && <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">Selected</span>}
          </div>
          <p className="text-sm text-gray-600 mt-2">No setup needed. We'll run with Ollama/local models as the default.</p>
        </button>
        <button
          onClick={() => setMode('bring-your-own')}
          className={`rounded-2xl border p-4 text-left transition-colors ${mode === 'bring-your-own' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-900">Bring my own (OpenAI/Claude)</div>
            {mode === 'bring-your-own' && <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">Selected</span>}
          </div>
          <p className="text-sm text-gray-600 mt-2">Paste your key; we never ask for your OpenAI/Anthropic password.</p>
        </button>
      </div>

      {mode === 'bring-your-own' && (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {providerOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setProvider(option.id)}
                className={`border rounded-2xl p-4 text-left transition-colors ${
                  provider === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">{option.label}</span>
                  {provider === option.id && (
                    <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">Active</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">{option.helper}</p>
                {option.cta && option.link && (
                  <a
                    href={option.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-700 font-semibold mt-3"
                  >
                    {option.cta} →
                  </a>
                )}
                {option.keyHint && (
                  <p className="text-xs text-gray-500 mt-1">Key format: {option.keyHint}</p>
                )}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Model (optional)
              </label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={defaultModel(provider)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">If empty, we use a sensible default for the provider.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                API Key (never your account password)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  provider === 'openai'
                    ? 'Starts with sk-...'
                    : provider === 'anthropic'
                    ? 'Starts with sk-ant-...'
                    : 'Optional for Ollama'
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                We never ask for your OpenAI/Claude login. Paste only the API key from your account.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberLocal}
                  onChange={(e) => setRememberLocal(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Remember on this device (adds headers with your key)</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToAccount}
                  onChange={(e) => setSaveToAccount(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Save encrypted to my account for reuse across devices ({isAuthenticated ? 'requires key' : 'sign in required'})
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300"
              >
                {loading ? 'Saving...' : 'Save AI Settings'}
              </button>
              <button
                onClick={handleClearLocal}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-semibold"
              >
                Clear local
              </button>
              {serverHasKey && (
                <button
                  onClick={handleRemoveBackendKey}
                  className="px-4 py-3 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 text-sm font-semibold"
                  disabled={loading}
                >
                  Remove saved key
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {mode === 'built-in' && (
        <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-800">
          Using Ariel built-in AI (Ollama). Switch to "Bring my own" if you want to use your OpenAI/Claude key.
        </div>
      )}

      {status && (
        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-800">
          {status}
        </div>
      )}
    </section>
  );
}
