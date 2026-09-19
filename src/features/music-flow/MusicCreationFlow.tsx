import { useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type TextareaHTMLAttributes } from 'react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useTheme } from '../../hooks/useTheme';
import {
  buildExternalLyricsPrompt, buildSunoOutput, createArrangement, MOOD_TEMPLATES, parseAndReviewLyrics,
  STYLE_TEMPLATES, suggestStyleFromReference, type FlowSection, type ReferenceInput, type StyleFacets,
  type StyleTemplate,
} from './musicFlow';

const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950';
const textarea = `${input} min-h-[4.75rem] resize-y overflow-hidden`;
const emptyReference: ReferenceInput = { artist: '', song: '', vocal: '', melody: '', url: '', notes: '' };

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return <button onClick={() => void navigator.clipboard.writeText(value).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1200); })} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white">{copied ? '✓ 已複製' : label}</button>;
}

function TemplateButtons({ templates, value, onSelect }: {
  templates: readonly StyleTemplate[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? templates : templates.slice(0, 6);
  return <div className="mb-2"><div className="flex flex-wrap gap-1.5">{visible.map((template) => <button
    key={template.id}
    type="button"
    title={template.description}
    onClick={() => onSelect(template.value)}
    className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition ${value === template.value ? 'border-violet-500 bg-violet-600 text-white' : 'border-slate-200 bg-slate-50 hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800'}`}
  >{template.name}</button>)}{templates.length > 6 && <button type="button" onClick={() => setShowAll((open) => !open)} className="rounded-full border border-dashed border-violet-300 px-2.5 py-1.5 text-[11px] font-semibold text-violet-600 dark:border-violet-700 dark:text-violet-300">{showAll ? '收起' : `更多 ${templates.length - 6} 個`}</button>}</div></div>;
}

function AutoTextarea({ value, onChange, minRows = 2, className = '', ...props }: {
  value: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  minRows?: number;
  className?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'rows'>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.max(element.scrollHeight, minRows * 24 + 22)}px`;
  }, [value, minRows]);
  return <textarea ref={ref} value={value} onChange={onChange} rows={minRows} className={`${textarea} ${className}`} {...props} />;
}

export function MusicCreationFlow() {
  const [theme, toggleTheme] = useTheme();
  const [reference, setReference] = useState(emptyReference);
  const [style, setStyle] = useState<StyleFacets>(() => suggestStyleFromReference(emptyReference));
  const [sections, setSections] = useState<FlowSection[]>(() => createArrangement(style));
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [language, setLanguage] = useState('繁體中文');
  const [lyrics, setLyrics] = useState('');
  const [instrumental, setInstrumental] = useState(false);
  const [model, setModel] = useState('v6');
  const lyricsPrompt = useMemo(() => buildExternalLyricsPrompt({ title, concept, language, style, sections }), [title, concept, language, style, sections]);
  const review = useMemo(() => parseAndReviewLyrics(lyrics, sections), [lyrics, sections]);
  const output = useMemo(() => buildSunoOutput({ style, sections, lyrics, instrumental, model }), [style, sections, lyrics, instrumental, model]);
  const updateRef = (key: keyof ReferenceInput, value: string) => setReference((current) => ({ ...current, [key]: value }));
  const updateStyle = (key: keyof StyleFacets, value: string) => setStyle((current) => ({ ...current, [key]: value }));

  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4"><div><h1 className="text-lg font-black">Suno 音樂生成流程</h1><p className="text-xs text-slate-500">參考 → 風格 → 起伏 → 填詞 → Suno 輸出</p></div><ThemeToggle theme={theme} onToggle={toggleTheme} /></div></header>
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-violet-100">真正的創作起點</p><h2 className="mt-2 text-2xl font-black">先告訴我，你腦中參考的是什麼</h2><p className="mt-2 text-sm text-violet-100">可以是樂團、歌曲、人聲、旋律感，或一段文字。工具會轉譯成可調整的音樂特徵，不要求直接模仿特定作品。</p></section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-bold">1 · 參考音樂</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><input className={input} value={reference.artist} onChange={(e) => updateRef('artist', e.target.value)} placeholder="樂團／音樂人，例如某個樂團的編曲感" /><input className={input} value={reference.song} onChange={(e) => updateRef('song', e.target.value)} placeholder="歌曲名稱或作品特徵" /><input className={input} value={reference.vocal} onChange={(e) => updateRef('vocal', e.target.value)} placeholder="人聲，例如低沉、氣聲、爆發力" /><input className={input} value={reference.melody} onChange={(e) => updateRef('melody', e.target.value)} placeholder="旋律，例如上行 hook、長音副歌" /><input className={input} value={reference.url} onChange={(e) => updateRef('url', e.target.value)} placeholder="參考連結（選填）" /><input className={input} value={reference.notes} onChange={(e) => updateRef('notes', e.target.value)} placeholder="其他想保留的感覺" /></div><button onClick={() => { const next = suggestStyleFromReference(reference); setStyle(next); setSections(createArrangement(next, instrumental)); }} className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white dark:bg-violet-600">轉成可調風格 →</button></section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-bold">2 · 調整風格</h2><p className="mt-1 text-xs text-amber-600">產品轉譯建議，不是 Suno 官方規格。中文意圖會整理成較適合 Style 欄位的音樂特徵。</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{([['genre','曲風／核心參考'],['mood','情緒'],['instruments','樂器與角色'],['vocal','人聲'],['tempo','速度／律動'],['production','製作與音色'],['avoid','避免事項']] as Array<[keyof StyleFacets,string]>).map(([key,label]) => <label key={key} className={key === 'genre' || key === 'production' ? 'sm:col-span-2' : ''}><span className="mb-1.5 block text-xs font-bold">{label} <span className="font-normal text-slate-400">· 選樣板後可自由修改</span></span><TemplateButtons templates={key === 'mood' ? MOOD_TEMPLATES : STYLE_TEMPLATES[key]} value={style[key]} onSelect={(value) => updateStyle(key, value)} /><AutoTextarea minRows={key === 'genre' || key === 'mood' || key === 'production' || key === 'avoid' ? 3 : 2} value={style[key]} onChange={(e) => updateStyle(key, e.target.value)} /></label>)}</div></section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">3 · 段落與起伏</h2><p className="text-xs text-slate-500">已依一般歌曲弧線配置，你只要調整不符合想像的部分。</p></div><button onClick={() => setSections(createArrangement(style, instrumental))} className="rounded-lg border px-3 py-2 text-xs font-bold">重新配置</button></div><div className="mt-4 space-y-2">{sections.map((section, index) => <div key={`${section.tag}-${index}`} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[8rem_7rem_1fr] dark:bg-slate-800"><input className={input} value={section.tag} onChange={(e) => setSections((items) => items.map((item, i) => i === index ? { ...item, tag: e.target.value } : item))} /><label className="text-xs">能量 {section.energy}/10<input className="w-full" type="range" min="1" max="10" value={section.energy} onChange={(e) => setSections((items) => items.map((item, i) => i === index ? { ...item, energy: Number(e.target.value) } : item))} /></label><input className={input} value={section.direction} onChange={(e) => setSections((items) => items.map((item, i) => i === index ? { ...item, direction: e.target.value } : item))} /></div>)}</div></section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-bold">4 · 交給其他 AI 填詞，再貼回來</h2><div className="mt-4 grid gap-4 lg:grid-cols-2"><div><div className="mb-2 grid grid-cols-2 gap-2"><input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="歌名" /><input className={input} value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="語言" /></div><AutoTextarea minRows={3} value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="歌詞主題／故事" /><textarea readOnly className={`${input} mt-2 min-h-[20rem] resize-y font-mono text-xs leading-5`} rows={14} value={lyricsPrompt} /><div className="mt-2"><CopyButton value={lyricsPrompt} label="複製填詞 Prompt" /></div></div><div><textarea className={`${input} min-h-[24rem] resize-y leading-6`} rows={18} value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="把其他 AI 生成的完整歌詞貼在這裡…" />{lyrics.trim() && <div className={`mt-2 rounded-xl p-3 text-xs ${review.issues.length ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200'}`}><strong>{review.issues.length ? `發現 ${review.issues.length} 項待確認` : '✓ 段落結構完整'}</strong>{review.issues.length > 0 && <ul className="mt-1 list-disc pl-4">{review.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}</div>}</div></div></section>

      <section className="rounded-3xl border-2 border-violet-300 bg-white p-5 dark:border-violet-800 dark:bg-slate-900"><h2 className="text-xl font-black">5 · 最終檢視與 Suno 輸出</h2><div className="mt-4 flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={instrumental} onChange={(e) => setInstrumental(e.target.checked)} /> 純音樂</label><label>模型 <select className="ml-2 rounded border bg-transparent px-2 py-1" value={model} onChange={(e) => setModel(e.target.value)}><option>v6</option><option>v6-wild</option><option>v6-mini</option></select></label></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><div><div className="mb-2 flex items-center justify-between"><strong>Style</strong><CopyButton value={output.style} label="複製 Style" /></div><AutoTextarea readOnly minRows={6} className="font-mono text-xs leading-5" value={output.style} /><p className="mt-2 text-xs text-slate-500">Exclude styles：{output.settings.excludeStyles || '無'}</p></div><div><div className="mb-2 flex items-center justify-between"><strong>Custom Lyrics</strong><CopyButton value={output.customLyrics} label="複製 Custom Lyrics" /></div><textarea readOnly rows={14} className={`${input} min-h-[22rem] resize-y font-mono text-xs leading-5`} value={output.customLyrics} /></div></div><div className="mt-4 rounded-xl bg-slate-950 p-4 text-xs text-slate-200"><strong>Custom 設定</strong><pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(output.settings, null, 2)}</pre></div></section>
    </main>
  </div>;
}
