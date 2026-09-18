import { useEffect, useMemo, useRef, useState } from 'react';
import { PROVIDERS } from '../../data';
import { useApiSettings } from '../../hooks/useApiSettings';
import { callLlm } from '../../lib/llm';
import {
  buildLyricsAiPrompt,
  canRunLyricsAiTask,
  normalizeLyricsAiOutput,
  type LyricsAiContext,
  type LyricsAiTask,
} from './lyricsAi';

export interface LyricsAiPanelProps {
  lyrics: string;
  onApply: (lyrics: string) => void;
  context?: LyricsAiContext;
  defaultTask?: LyricsAiTask;
  className?: string;
}

type PanelMode = 'prompt' | 'api';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:ring-violet-950';

/** 可重用的 v6 歌詞生成／局部修改面板；成功後以純文字交給 onApply。 */
export function LyricsAiPanel({ lyrics, onApply, context, defaultTask = 'generate', className = '' }: LyricsAiPanelProps) {
  const settings = useApiSettings();
  const [mode, setMode] = useState<PanelMode>('prompt');
  const [task, setTask] = useState<LyricsAiTask>(defaultTask);
  const [instruction, setInstruction] = useState('');
  const [rememberOnDevice, setRememberOnDevice] = useState(settings.isPersisted);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => setRememberOnDevice(settings.isPersisted), [settings.isPersisted]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const prompt = useMemo(() => buildLyricsAiPrompt({ task, lyrics, instruction, context }), [context, instruction, lyrics, task]);
  const provider = PROVIDERS[settings.provider] ?? PROVIDERS.openrouter;

  const changeProvider = (value: string) => {
    settings.setProvider(value);
    settings.setModel('');
    settings.setBaseUrl('');
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError('無法存取剪貼簿，請手動複製。');
    }
  };

  const generate = async () => {
    if (!settings.apiKey.trim()) {
      setError('請填入 API key。');
      return;
    }
    if (!canRunLyricsAiTask(task, lyrics)) {
      setError('局部修改需要先有既有歌詞。');
      return;
    }
    setGenerating(true);
    setError('');
    setOutput('');
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      if (rememberOnDevice) settings.persist();
      else settings.forgetPersisted();
      const result = await callLlm({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        baseUrl: settings.baseUrl,
        prompt,
        signal: controller.signal,
        onChunk: (_delta, accumulated) => setOutput(normalizeLyricsAiOutput(accumulated)),
      });
      setOutput(normalizeLyricsAiOutput(result));
    } catch (reason) {
      if ((reason as Error).name === 'AbortError') setError('已中止生成。');
      else setError(`生成失敗：${(reason as Error).message}`);
    } finally {
      abortRef.current = null;
      setGenerating(false);
    }
  };

  return (
    <section className={`rounded-2xl border border-violet-200 bg-violet-50/60 p-5 dark:border-violet-900 dark:bg-violet-950/20 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Lyrics AI</p><h2 className="mt-1 text-lg font-bold">歌詞生成與局部精修</h2></div>
        <div className="flex rounded-xl bg-white p-1 shadow-sm dark:bg-slate-900">
          {([['prompt', '匯出 Prompt'], ['api', 'API 生成']] as const).map(([value, label]) => <button type="button" key={value} onClick={() => setMode(value)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === value ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{label}</button>)}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setTask('generate')} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${task === 'generate' ? 'border-violet-500 bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>整首生成</button>
        <button type="button" onClick={() => setTask('edit-lyrics')} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${task === 'edit-lyrics' ? 'border-violet-500 bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>局部修改</button>
      </div>

      <label className="mb-4 block"><span className="mb-1.5 block text-sm font-semibold">{task === 'generate' ? '創作指令' : '修改指令'}</span><textarea className={inputClass} rows={3} value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder={task === 'generate' ? '例：副歌要有一句容易記住的 hook，敘事從雨夜走向天亮' : '例：只重寫第二段主歌，增加內韻並避免抽象詞'} /></label>

      {mode === 'prompt' ? <div className="space-y-3"><textarea className={`${inputClass} font-mono text-xs`} rows={10} readOnly value={prompt} /><button type="button" onClick={copyPrompt} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">{copied ? '已複製' : '複製 Prompt'}</button></div> : <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-xs font-semibold">Provider</span><select className={inputClass} value={settings.provider} onChange={(event) => changeProvider(event.target.value)}>{Object.entries(PROVIDERS).map(([id, item]) => <option key={id} value={id}>{item.name}</option>)}</select></label><label><span className="mb-1 block text-xs font-semibold">Model</span><input className={inputClass} value={settings.model} onChange={(event) => settings.setModel(event.target.value)} placeholder={provider.defaultModel} /></label></div>
        <label className="block"><span className="mb-1 block text-xs font-semibold">API Key</span><input className={`${inputClass} font-mono`} type="password" autoComplete="off" value={settings.apiKey} onChange={(event) => settings.setApiKey(event.target.value)} placeholder="僅保留於本次分頁 session" /></label>
        <label className="block"><span className="mb-1 block text-xs font-semibold">Base URL（選填）</span><input className={`${inputClass} font-mono`} value={settings.baseUrl} onChange={(event) => settings.setBaseUrl(event.target.value)} placeholder={provider.baseUrl} /></label>
        <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><input type="checkbox" className="mt-0.5 accent-violet-600" checked={rememberOnDevice} onChange={(event) => setRememberOnDevice(event.target.checked)} /><span><strong className="block">記住於此裝置</strong>勾選後才會將 API key 與設定存入 localStorage；未勾選時只存在本次分頁記憶體。</span></label>
        <div className="flex gap-2"><button type="button" disabled={generating} onClick={generate} className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-400">{generating ? '生成中…' : task === 'generate' ? '生成完整歌詞' : '執行局部修改'}</button>{generating && <button type="button" onClick={() => abortRef.current?.abort()} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">中止</button>}</div>
      </div>}

      {output && <div className="mt-4 space-y-3"><label className="block"><span className="mb-1 block text-xs font-semibold">AI 純文字輸出</span><textarea className={inputClass} rows={12} value={output} onChange={(event) => setOutput(event.target.value)} /></label><button type="button" disabled={generating} onClick={() => onApply(output)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">回填歌詞</button></div>}
      {error && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
    </section>
  );
}
