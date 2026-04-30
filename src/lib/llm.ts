import { PROVIDERS } from '../data';

export interface LlmCallOptions {
  provider: string;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  prompt: string;
  /** 串流回呼，每次有新文字時呼叫 */
  onChunk?: (delta: string, accumulated: string) => void;
  /** 中止訊號 */
  signal?: AbortSignal;
}

/**
 * 呼叫 LLM。若提供 onChunk 則使用 streaming。
 * 回傳完整生成文字。
 */
export async function callLlm(opts: LlmCallOptions): Promise<string> {
  const cfg = PROVIDERS[opts.provider];
  if (!cfg) throw new Error(`未知的 provider: ${opts.provider}`);

  const model = (opts.model || '').trim() || cfg.defaultModel;
  const baseUrl = (opts.baseUrl || '').trim() || cfg.baseUrl;
  const useStream = !!opts.onChunk;

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
      signal: opts.signal,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: opts.prompt }],
        temperature: 0.8,
        max_tokens: 2000,
        stream: useStream,
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${res.status}`);
    }
    if (useStream && res.body) {
      return readSseOpenAi(res.body, opts.onChunk!);
    }
    const data = await res.json();
    return data.choices[0].message.content as string;
  }

  if (cfg.type === 'anthropic') {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      signal: opts.signal,
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
        stream: useStream,
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${res.status}`);
    }
    if (useStream && res.body) {
      return readSseAnthropic(res.body, opts.onChunk!);
    }
    const data = await res.json();
    return data.content[0].text as string;
  }

  if (cfg.type === 'gemini') {
    // Gemini 也支援 streaming，但格式不同
    const endpoint = useStream
      ? `${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${opts.apiKey}`
      : `${baseUrl}/models/${model}:generateContent?key=${opts.apiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: opts.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: opts.prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2000 },
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${res.status}`);
    }
    if (useStream && res.body) {
      return readSseGemini(res.body, opts.onChunk!);
    }
    const data = await res.json();
    return data.candidates[0].content.parts[0].text as string;
  }

  throw new Error(`不支援的 provider type: ${cfg.type}`);
}

// ===== SSE Parsers =====

async function readSse(
  body: ReadableStream<Uint8Array>,
  onEvent: (data: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let lineBreak = buf.indexOf('\n');
    while (lineBreak >= 0) {
      const line = buf.slice(0, lineBreak).trim();
      buf = buf.slice(lineBreak + 1);
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (data && data !== '[DONE]') onEvent(data);
      }
      lineBreak = buf.indexOf('\n');
    }
  }
}

async function readSseOpenAi(
  body: ReadableStream<Uint8Array>,
  onChunk: (delta: string, accumulated: string) => void,
): Promise<string> {
  let acc = '';
  await readSse(body, (data) => {
    try {
      const j = JSON.parse(data);
      const delta = j.choices?.[0]?.delta?.content || '';
      if (delta) {
        acc += delta;
        onChunk(delta, acc);
      }
    } catch {
      // ignore parse errors
    }
  });
  return acc;
}

async function readSseAnthropic(
  body: ReadableStream<Uint8Array>,
  onChunk: (delta: string, accumulated: string) => void,
): Promise<string> {
  let acc = '';
  await readSse(body, (data) => {
    try {
      const j = JSON.parse(data);
      // Anthropic streaming: content_block_delta events with delta.text
      const delta = j.delta?.text || '';
      if (delta) {
        acc += delta;
        onChunk(delta, acc);
      }
    } catch {
      // ignore
    }
  });
  return acc;
}

async function readSseGemini(
  body: ReadableStream<Uint8Array>,
  onChunk: (delta: string, accumulated: string) => void,
): Promise<string> {
  let acc = '';
  await readSse(body, (data) => {
    try {
      const j = JSON.parse(data);
      const delta = j.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (delta) {
        acc += delta;
        onChunk(delta, acc);
      }
    } catch {
      // ignore
    }
  });
  return acc;
}
