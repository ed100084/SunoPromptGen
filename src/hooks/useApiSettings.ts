import { useEffect, useState } from 'react';
import { PROVIDERS } from '../data';
import { STORAGE_KEYS, getItem, removeItem, setItem } from '../lib/storage';

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
  /** 是否載入過此裝置持久化的 API key。 */
  isPersisted: boolean;
  /** 將當前值寫回 localStorage（model / baseUrl 空白時 fallback 到 provider 預設）。 */
  persist: () => void;
  /** 移除此裝置持久化的 API 設定，不清除目前 session state。 */
  forgetPersisted: () => void;
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
  const [isPersisted, setIsPersisted] = useState(false);

  // 初始載入
  useEffect(() => {
    const k = getItem(STORAGE_KEYS.apiKey);
    const p = getItem(STORAGE_KEYS.apiProvider);
    const m = getItem(STORAGE_KEYS.apiModel);
    const b = getItem(STORAGE_KEYS.apiBase);
    if (k) {
      setApiKey(k);
      setIsPersisted(true);
    }
    if (p && PROVIDERS[p]) setProvider(p);
    if (m) setModel(m);
    if (b) setBaseUrl(b);
  }, []);

  const persist = () => {
    const config = PROVIDERS[provider] ?? PROVIDERS.openrouter;
    setItem(STORAGE_KEYS.apiKey, apiKey);
    setItem(STORAGE_KEYS.apiProvider, PROVIDERS[provider] ? provider : 'openrouter');
    setItem(STORAGE_KEYS.apiModel, model || config.defaultModel);
    setItem(STORAGE_KEYS.apiBase, baseUrl || config.baseUrl);
    setIsPersisted(Boolean(apiKey));
  };

  const forgetPersisted = () => {
    removeItem(STORAGE_KEYS.apiKey);
    removeItem(STORAGE_KEYS.apiProvider);
    removeItem(STORAGE_KEYS.apiModel);
    removeItem(STORAGE_KEYS.apiBase);
    setIsPersisted(false);
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
    isPersisted,
    persist,
    forgetPersisted,
  };
}
