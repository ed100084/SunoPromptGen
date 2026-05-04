import { useEffect, useState } from 'react';
import { PROVIDERS } from '../data';
import { STORAGE_KEYS, getItem, setItem } from '../lib/storage';

export interface ApiSettings {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface ApiSettingsApi extends ApiSettings {
  setProvider: (v: string) => void;
  setApiKey: (v: string) => void;
  setModel: (v: string) => void;
  setBaseUrl: (v: string) => void;
  /** 將當前值寫回 localStorage（model / baseUrl 空白時 fallback 到 provider 預設）。 */
  persist: () => void;
}

/**
 * 管理 LLM API 設定（provider / key / model / baseUrl），
 * 初始化時從 localStorage 載入，呼叫 persist() 寫回。
 */
export function useApiSettings(): ApiSettingsApi {
  const [provider, setProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  // 初始載入
  useEffect(() => {
    const k = getItem(STORAGE_KEYS.apiKey);
    const p = getItem(STORAGE_KEYS.apiProvider);
    const m = getItem(STORAGE_KEYS.apiModel);
    const b = getItem(STORAGE_KEYS.apiBase);
    if (k) setApiKey(k);
    if (p) setProvider(p);
    if (m) setModel(m);
    if (b) setBaseUrl(b);
  }, []);

  const persist = () => {
    setItem(STORAGE_KEYS.apiKey, apiKey);
    setItem(STORAGE_KEYS.apiProvider, provider);
    setItem(STORAGE_KEYS.apiModel, model || PROVIDERS[provider].defaultModel);
    setItem(STORAGE_KEYS.apiBase, baseUrl || PROVIDERS[provider].baseUrl);
  };

  return {
    provider,
    apiKey,
    model,
    baseUrl,
    setProvider,
    setApiKey,
    setModel,
    setBaseUrl,
    persist,
  };
}
