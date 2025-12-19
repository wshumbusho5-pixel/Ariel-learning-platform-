'use client';

export type LocalAICredentials = {
  provider: 'openai' | 'anthropic' | 'ollama';
  apiKey?: string;
  model?: string;
};

const LOCAL_KEY = 'ai_provider_pref';

export function loadLocalAICredentials(): LocalAICredentials | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalAICredentials(creds: LocalAICredentials) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(creds));
}

export function clearLocalAICredentials() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_KEY);
}
