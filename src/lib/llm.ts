import { PROVIDERS } from '../data';

export interface LlmCallOptions {
  provider: string;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  prompt: string;
}

export async function callLlm(opts: LlmCallOptions): Promise<string> {
  const cfg = PROVIDERS[opts.provider];
  if (!cfg) throw new Error(`未知的 provider: ${opts.provider}`);

  const model = (opts.model || '').trim() || cfg.defaultModel;
  const baseUrl = (opts.baseUrl || '').trim() || cfg.baseUrl;

  if (cfg.type === 'openai') {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
    };
    if (opts.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://github.com/ed100084/SunoPromptGen';
      headers['X-Title'] = 'Suno Prompt Generator';
    }
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: opts.prompt }],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
    return data.choices[0].message.content as string;
  }

  if (cfg.type === 'anthropic') {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': opts.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: opts.prompt }],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
    return data.content[0].text as string;
  }

  if (cfg.type === 'gemini') {
    const res = await fetch(`${baseUrl}/models/${model}:generateContent?key=${opts.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: opts.prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2000 },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
    return data.candidates[0].content.parts[0].text as string;
  }

  throw new Error(`不支援的 provider type: ${cfg.type}`);
}
