import { useEffect, useRef, useState } from 'react';
import { PROVIDERS } from '../../data';
import { useApiSettings } from '../../hooks/useApiSettings';
import { callLlm } from '../../lib/llm';
import { normalizeGeneratedLyrics } from './musicFlow';

const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950';
const AI_LINKS = [
  { name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { name: 'Claude', url: 'https://claude.ai/new' },
  { name: 'Gemini', url: 'https://gemini.google.com/app' },
] as const;

export function LyricsGenerationPanel({ prompt, onApply }: { prompt: string; onApply: (lyrics: string) => void }) {
  const settings = useApiSettings();
  const [tab, setTab] = useState<'direct' | 'external'>('direct');
  const [remember, setRemember] = useState(settings.isPersisted);
  const [openSettings, setOpenSettings] = useState(!settings.apiKey);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const provider = PROVIDERS[settings.provider] ?? PROVIDERS.openrouter;

  useEffect(() => setRemember(settings.isPersisted), [settings.isPersisted]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = async () => {
    if (!settings.apiKey.trim()) { setOpenSettings(true); setMessage('請先輸入 API Key。'); return; }
    setGenerating(true); setMessage(''); setOutput('');
    const controller = new AbortController(); abortRef.current = controller;
    try {
      if (remember) settings.persist(); else settings.forgetPersisted();
      const result = await callLlm({
        provider: settings.provider, apiKey: settings.apiKey, model: settings.model,
        baseUrl: settings.baseUrl, prompt, signal: controller.signal,
        onChunk: (_delta, accumulated) => setOutput(normalizeGeneratedLyrics(accumulated)),
      });
      const clean = normalizeGeneratedLyrics(result);
      setOutput(clean); onApply(clean); setMessage('✓ 已生成、回填並完成段落檢查。');
    } catch (reason) {
      setMessage((reason as Error).name === 'AbortError' ? '已中止生成。' : `生成失敗：${(reason as Error).message}`);
    } finally { setGenerating(false); abortRef.current = null; }
  };

  const copyAndOpen = async (url: string, name: string) => {
    try { await navigator.clipboard.writeText(prompt); window.open(url, '_blank', 'noopener,noreferrer'); setMessage(`已複製 Prompt 並開啟 ${name}。生成後複製結果，再回來按「從剪貼簿匯入」。`); }
    catch { setMessage('無法存取剪貼簿，請手動複製上方 Prompt。'); }
  };

  const importClipboard = async () => {
    try {
      const value = normalizeGeneratedLyrics(await navigator.clipboard.readText());
      if (!value) throw new Error('剪貼簿沒有文字');
      setOutput(value); onApply(value); setMessage('✓ 已從剪貼簿匯入、回填並完成段落檢查。');
    } catch (reason) { setMessage(`匯入失敗：${(reason as Error).message || '請允許剪貼簿權限。'}`); }
  };

  return <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/20">
    <div className="flex rounded-xl bg-white p-1 dark:bg-slate-900">{([['direct', '✨ AI 直接產生'], ['external', '↗ 使用其它 AI']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold ${tab === id ? 'bg-violet-600 text-white' : 'text-slate-500'}`}>{label}</button>)}</div>
    {tab === 'direct' ? <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between gap-3"><div><strong className="text-sm">BYOK 一鍵生成</strong><p className="text-xs text-slate-500">Key 只留在本次分頁；勾選後才保存於這台裝置。</p></div><button type="button" onClick={() => setOpenSettings((open) => !open)} className="rounded-lg border px-3 py-2 text-xs font-bold">{openSettings ? '收起設定' : 'AI 連線設定'}</button></div>
      {openSettings && <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-xs font-bold">Provider</span><select className={field} value={settings.provider} onChange={(event) => { settings.setProvider(event.target.value); settings.setModel(''); settings.setBaseUrl(''); }}>{Object.entries(PROVIDERS).map(([id, item]) => <option key={id} value={id}>{item.name}</option>)}</select></label><label><span className="mb-1 block text-xs font-bold">Model</span><input className={field} value={settings.model} onChange={(event) => settings.setModel(event.target.value)} placeholder={provider.defaultModel} /></label></div><label><span className="mb-1 block text-xs font-bold">API Key</span><input type="password" autoComplete="off" className={`${field} font-mono`} value={settings.apiKey} onChange={(event) => settings.setApiKey(event.target.value)} placeholder="貼上自己的 API Key" /></label><label><span className="mb-1 block text-xs font-bold">Base URL（選填）</span><input className={`${field} font-mono`} value={settings.baseUrl} onChange={(event) => settings.setBaseUrl(event.target.value)} placeholder={provider.baseUrl} /></label><label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span><strong>記住於此裝置</strong><br />這會把 API Key 存入此瀏覽器的 localStorage；不勾選則只存在目前分頁。</span></label>{settings.isPersisted && <button type="button" onClick={() => { settings.forgetPersisted(); setRemember(false); setMessage('已移除此裝置保存的 API 設定。'); }} className="text-left text-xs font-bold text-rose-600">移除已保存的 API 設定</button>}</div>}
      <div className="flex gap-2"><button type="button" disabled={generating} onClick={generate} className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white disabled:bg-slate-400">{generating ? '生成中…' : '生成完整歌詞並回填'}</button>{generating && <button type="button" onClick={() => abortRef.current?.abort()} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">中止</button>}</div>
    </div> : <div className="mt-4 space-y-3"><p className="text-xs text-slate-500">按一下會複製 Prompt 並開啟 AI。生成後複製結果，回來一鍵匯入。</p><div className="grid grid-cols-3 gap-2">{AI_LINKS.map((item) => <button key={item.name} type="button" onClick={() => void copyAndOpen(item.url, item.name)} className="rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">開啟 {item.name}</button>)}</div><button type="button" onClick={() => void importClipboard()} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">📋 從剪貼簿匯入並檢查</button></div>}
    {output && <details className="mt-3"><summary className="cursor-pointer text-xs font-bold text-violet-600">查看最近生成／匯入的歌詞</summary><textarea className={`${field} mt-2 min-h-48 font-mono text-xs`} value={output} onChange={(event) => setOutput(event.target.value)} /></details>}
    {message && <p role="status" className={`mt-3 rounded-lg p-3 text-xs ${message.startsWith('生成失敗') || message.startsWith('匯入失敗') || message.startsWith('請先') ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200'}`}>{message}</p>}
  </div>;
}
