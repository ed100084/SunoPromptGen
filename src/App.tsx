import { useEffect, useMemo, useState } from 'react';
import {
  ENERGY,
  GENRES,
  INSTRUMENTS,
  LANGUAGES,
  MOODS,
  NEGATIVES,
  PROVIDERS,
  SCENARIOS,
  STRUCTURE_TEMPLATES,
  TEXTURES,
  VOCALS,
  COHESION_KEYWORDS,
} from './data';
import type { AiMode, HistoryEntry, Section, SongState } from './types';
import {
  buildFullPrompt,
  buildLlmRequestPrompt,
  buildLyricsPrompt,
  buildStylePrompt,
  parseLlmResponse,
} from './lib/promptBuilder';
import { callLlm } from './lib/llm';
import { generateTemplateLyrics } from './lib/template';
import { addEntry } from './lib/history';
import { useTheme } from './hooks/useTheme';
import { Section as SectionBlock } from './components/Section';
import { MultiSelectChips } from './components/MultiSelectChips';
import { SingleSelect } from './components/SingleSelect';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ThemeToggle } from './components/ThemeToggle';
import { LyricsAnalyzer } from './components/LyricsAnalyzer';

const DEFAULT_STATE: SongState = {
  songTitle: '',
  language: '華語(繁體)',
  genre: '華語抒情',
  moods: ['溫暖'],
  energy: '中（穩定流動）',
  instruments: ['暖音鋼琴', '弦樂'],
  vocals: ['女聲(柔/氣音)'],
  textures: ['電影感製作'],
  negatives: ['無 Autotune'],
  bpm: '75',
  musicKey: 'C major',
  extra: '',
  cohesion: true,
  voiceCloneActive: false,
  structureName: '抒情骨架 (Intro-V-C-V-C-B-C)',
  sections: STRUCTURE_TEMPLATES['抒情骨架 (Intro-V-C-V-C-B-C)'].map((x) => ({ ...x })),
  lyricsTheme: '',
  lyricsKeywords: '',
  lyricsStory: '',
};

export function App() {
  const [theme, toggleTheme] = useTheme();
  const [state, setState] = useState<SongState>(DEFAULT_STATE);
  const [scenario, setScenario] = useState('');
  const [aiMode, setAiMode] = useState<AiMode>('export');
  const [aiProvider, setAiProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [apiModel, setApiModel] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [genSuccess, setGenSuccess] = useState('');
  const [exportPrompt, setExportPrompt] = useState('');
  const [streamText, setStreamText] = useState('');
  const [streamCtrl, setStreamCtrl] = useState<AbortController | null>(null);
  const [useStreaming, setUseStreaming] = useState(true);
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // 載入儲存的 API 設定
  useEffect(() => {
    const k = localStorage.getItem('suno_api_key');
    const p = localStorage.getItem('suno_api_provider');
    const m = localStorage.getItem('suno_api_model');
    const b = localStorage.getItem('suno_api_base');
    if (k) setApiKey(k);
    if (p) setAiProvider(p);
    if (m) setApiModel(m);
    if (b) setApiBaseUrl(b);
  }, []);

  // 部分 setter helper
  const update = <K extends keyof SongState>(key: K, value: SongState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  // 套用情境
  const applyScenario = (name: string) => {
    if (!name) return;
    const sc = SCENARIOS[name];
    setScenario(name);
    setState({
      ...state,
      language: sc.language,
      genre: sc.genre,
      moods: [...sc.moods],
      energy: sc.energy,
      instruments: [...sc.instruments],
      vocals: [...sc.vocals],
      textures: [...sc.textures],
      negatives: [...sc.negatives],
      bpm: sc.bpm,
      musicKey: sc.key,
      extra: sc.extra,
      structureName: sc.structure,
      sections: STRUCTURE_TEMPLATES[sc.structure].map((x) => ({ ...x })),
    });
  };

  const applyStructure = (name: string) => {
    setState((s) => ({
      ...s,
      structureName: name,
      sections: STRUCTURE_TEMPLATES[name].map((x) => ({ ...x })),
    }));
  };

  const updateSection = (idx: number, field: keyof Section, value: string) => {
    setState((s) => ({
      ...s,
      sections: s.sections.map((sec, i) => (i === idx ? { ...sec, [field]: value } : sec)),
    }));
  };

  const addSection = () => {
    setState((s) => ({ ...s, sections: [...s.sections, { tag: 'Verse', desc: '', lyrics: '' }] }));
  };

  const removeSection = (idx: number) => {
    setState((s) => ({ ...s, sections: s.sections.filter((_, i) => i !== idx) }));
  };

  const moveSection = (idx: number, dir: number) => {
    setState((s) => {
      const next = [...s.sections];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return s;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...s, sections: next };
    });
  };

  // Prompts
  const stylePrompt = useMemo(() => buildStylePrompt(state), [state]);
  const lyricsPrompt = useMemo(() => buildLyricsPrompt(state.sections), [state.sections]);
  const fullPrompt = useMemo(
    () => buildFullPrompt(state, stylePrompt, lyricsPrompt),
    [state, stylePrompt, lyricsPrompt],
  );

  // 字數警示
  const styleLen = stylePrompt.length;
  const tagCount = stylePrompt.split(',').filter((x) => x.trim()).length;

  const totalLyricsChars = useMemo(
    () => state.sections.reduce((sum, s) => sum + s.lyrics.length, 0),
    [state.sections],
  );

  // 複製
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied((p) => ({ ...p, [key]: true }));
      setTimeout(() => setCopied((p) => ({ ...p, [key]: false })), 1500);
    });
  };

  // 顯示成功訊息
  const showSuccess = (msg: string) => {
    setGenSuccess(msg);
    setTimeout(() => {
      const el = document.getElementById('section-structure');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    setTimeout(() => setGenSuccess(''), 4000);
  };

  // === AI 生成 ===
  const handleExportPrompt = () => {
    setExportPrompt(buildLlmRequestPrompt(state, stylePrompt));
    setGenError('');
  };

  const handleApiGenerate = async () => {
    if (!apiKey.trim()) {
      setGenError('請填入 API key');
      return;
    }
    setGenerating(true);
    setGenError('');
    setStreamText('');
    const ctrl = new AbortController();
    setStreamCtrl(ctrl);
    try {
      const text = await callLlm({
        provider: aiProvider,
        apiKey,
        model: apiModel,
        baseUrl: apiBaseUrl,
        prompt: buildLlmRequestPrompt(state, stylePrompt),
        signal: ctrl.signal,
        onChunk: useStreaming ? (_delta, acc) => setStreamText(acc) : undefined,
      });
      const parsed = parseLlmResponse(text);
      setState((s) => ({
        ...s,
        sections: s.sections.map((sec, i) => {
          const m = parsed.sections.find((ps) => ps.tag === sec.tag) || parsed.sections[i];
          return m ? { ...sec, lyrics: (m.lyrics || '').trim() } : sec;
        }),
      }));
      localStorage.setItem('suno_api_key', apiKey);
      localStorage.setItem('suno_api_provider', aiProvider);
      localStorage.setItem('suno_api_model', apiModel || PROVIDERS[aiProvider].defaultModel);
      localStorage.setItem('suno_api_base', apiBaseUrl || PROVIDERS[aiProvider].baseUrl);
      showSuccess(`✓ 已從 API 生成歌詞（${parsed.sections.length} 段）`);
      setStreamText('');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setGenError('已中止');
      } else {
        setGenError(`生成失敗：${(err as Error).message}`);
      }
    } finally {
      setGenerating(false);
      setStreamCtrl(null);
    }
  };

  const handleAbort = () => {
    streamCtrl?.abort();
  };

  const handleTemplateGenerate = () => {
    setGenError('');
    const result = generateTemplateLyrics(state.sections, {
      moods: state.moods,
      keywords: state.lyricsKeywords,
      theme: state.lyricsTheme,
    });
    setState((s) => ({ ...s, sections: result.sections }));
    showSuccess(`✓ 已產生 ${result.filled} 段歌詞草稿`);
  };

  const handleImportFromJson = (text: string) => {
    try {
      const parsed = parseLlmResponse(text);
      setState((s) => ({
        ...s,
        sections: s.sections.map((sec, i) => {
          const m = parsed.sections.find((ps) => ps.tag === sec.tag) || parsed.sections[i];
          return m ? { ...sec, lyrics: (m.lyrics || '').trim() } : sec;
        }),
      }));
      showSuccess(`✓ 已匯入 ${parsed.sections.length} 段歌詞`);
      setGenError('');
    } catch (err) {
      setGenError(`解析失敗：${(err as Error).message}`);
    }
  };

  // 儲存到歷史
  const handleSaveHistory = () => {
    addEntry(state, stylePrompt, lyricsPrompt);
    setHistoryRefresh((n) => n + 1);
    showSuccess('✓ 已儲存到歷史紀錄');
  };

  // 載入歷史
  const handleLoadHistory = (entry: HistoryEntry) => {
    setState(entry.state);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <header className="mb-4 sm:mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Suno Prompt Generator
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              v5.5 四層架構優化｜中文友善｜抗切割感
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
              v5.5
            </span>
            <button
              onClick={() => setHistoryOpen(true)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              title="歷史紀錄"
            >
              📜
            </button>
            <button
              onClick={handleSaveHistory}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              title="儲存當前到歷史"
            >
              💾
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* === 左欄 === */}
          <div className="lg:col-span-7">

            <SectionBlock title="🎯 一鍵情境範本" hint="選擇後自動填入所有欄位，再依需要微調">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(SCENARIOS).map(([name, info]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => applyScenario(name)}
                    className={`text-left p-3 rounded-lg border transition ${
                      scenario === name
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'
                    }`}
                  >
                    <div className="font-medium text-sm text-slate-800 dark:text-slate-100">
                      {name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {info.desc}
                    </div>
                  </button>
                ))}
              </div>
            </SectionBlock>

            <SectionBlock
              title="🎼 Layer 1：基本骨架"
              hint="v5.5 第一層：tempo + key + 曲風 + 能量強度 + 語言"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                    歌曲標題（選填）
                  </label>
                  <input
                    type="text"
                    value={state.songTitle}
                    onChange={(e) => update('songTitle', e.target.value)}
                    placeholder="例：心之所向"
                    className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">🌐 語言 / 語系</label>
                  <SingleSelect options={LANGUAGES} value={state.language} onChange={(v) => update('language', v)} />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">曲風</label>
                  <SingleSelect options={GENRES} value={state.genre} onChange={(v) => update('genre', v)} />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">能量強度</label>
                  <SingleSelect options={ENERGY} value={state.energy} onChange={(v) => update('energy', v)} />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">BPM</label>
                  <input
                    type="number"
                    value={state.bpm}
                    onChange={(e) => update('bpm', e.target.value)}
                    min={40}
                    max={200}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">調性 Key</label>
                  <input
                    type="text"
                    value={state.musicKey}
                    onChange={(e) => update('musicKey', e.target.value)}
                    placeholder="C major / Am"
                    className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              {state.language === '純樂器(無歌詞)' && (
                <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                  ⚠️ 純樂器模式：人聲將被略過，歌詞段落清空
                </div>
              )}
            </SectionBlock>

            <SectionBlock title="😌 情緒（建議 1-2 個）">
              <MultiSelectChips options={MOODS} selected={state.moods} onChange={(v) => update('moods', v)} color="rose" />
            </SectionBlock>

            <SectionBlock
              title="🎸 Layer 2：樂器配置（建議 2-4 項）"
              hint="v5.5 對「形容詞+樂器」反應比裸樂器名更精準"
            >
              <MultiSelectChips
                options={INSTRUMENTS}
                selected={state.instruments}
                onChange={(v) => update('instruments', v)}
                color="emerald"
              />
            </SectionBlock>

            <SectionBlock
              title="🎤 Layer 3：人聲方向"
              hint="若使用 Voice Clone 建議勾選下方略過人聲描述"
            >
              <label className="flex items-center gap-2 mb-3 cursor-pointer select-none text-sm">
                <input
                  type="checkbox"
                  checked={state.voiceCloneActive}
                  onChange={(e) => update('voiceCloneActive', e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span
                  className={
                    state.voiceCloneActive
                      ? 'text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-slate-600 dark:text-slate-300'
                  }
                >
                  我已啟用 Voice Clone（自動略過人聲描述）
                </span>
              </label>
              {!state.voiceCloneActive && (
                <MultiSelectChips
                  options={VOCALS}
                  selected={state.vocals}
                  onChange={(v) => update('vocals', v)}
                  color="indigo"
                />
              )}
              {state.voiceCloneActive && (
                <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  Voice Clone 模式：人聲描述已略過，避免衝突
                </div>
              )}
            </SectionBlock>

            <SectionBlock
              title="🎚️ Layer 4：製作風格 / 紋理（建議 2-3 項）"
              hint="v5.5 對細節描述（板式殘響、貼耳收音等）反應極佳"
            >
              <MultiSelectChips
                options={TEXTURES}
                selected={state.textures}
                onChange={(v) => update('textures', v)}
                color="amber"
              />
            </SectionBlock>

            <SectionBlock
              title="🚫 Negative Prompts（v5.5 必用！建議 2-3 個）"
              hint="明確告訴模型不要什麼，比正向描述更能聚焦結果"
            >
              <MultiSelectChips
                options={NEGATIVES}
                selected={state.negatives}
                onChange={(v) => update('negatives', v)}
                color="red"
              />
            </SectionBlock>

            <SectionBlock title="✨ 抗切割感" hint="自動加入 seamless transitions 等關鍵字">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={state.cohesion}
                  onChange={(e) => update('cohesion', e.target.checked)}
                  className="w-5 h-5 accent-indigo-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">啟用連貫性關鍵字（建議開啟）</span>
              </label>
              {state.cohesion && (
                <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded text-xs text-indigo-800 dark:text-indigo-300 font-mono break-all">
                  + {COHESION_KEYWORDS}
                </div>
              )}
            </SectionBlock>

            <SectionBlock title="➕ 額外補充關鍵字">
              <textarea
                value={state.extra}
                onChange={(e) => update('extra', e.target.value)}
                rows={2}
                placeholder="例：90s style, retro synth"
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none text-sm"
              />
            </SectionBlock>

            {/* AI 歌詞生成 */}
            <SectionBlock
              title="🎨 AI 歌詞生成"
              hint="生成內容會自動填入下方段落，純樂器段（Intro/Outro）會留空"
            >
              <div className="grid grid-cols-1 gap-3 mb-4">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">主題句</label>
                  <input
                    type="text"
                    value={state.lyricsTheme}
                    onChange={(e) => update('lyricsTheme', e.target.value)}
                    placeholder="例：離職送別、第一次心動"
                    className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">關鍵字（用逗號分隔）</label>
                  <input
                    type="text"
                    value={state.lyricsKeywords}
                    onChange={(e) => update('lyricsKeywords', e.target.value)}
                    placeholder="例：回憶, 感謝, 未來, 並肩"
                    className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">故事背景（選填）</label>
                  <textarea
                    value={state.lyricsStory}
                    onChange={(e) => update('lyricsStory', e.target.value)}
                    rows={3}
                    placeholder="描述歌曲背後的情境、角色、時空、情感弧線..."
                    className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-1 mb-3 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                {[
                  { k: 'export' as const, label: '📋 匯出 Prompt' },
                  { k: 'api' as const, label: '🚀 API 生成' },
                  { k: 'template' as const, label: '🎲 本地模板' },
                ].map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setAiMode(t.k)}
                    className={`px-3 py-2 text-sm border-b-2 -mb-px transition whitespace-nowrap ${
                      aiMode === t.k
                        ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {aiMode === 'export' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    產生 prompt 貼到 Claude.ai / ChatGPT，再貼回 JSON 即可。
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleExportPrompt}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                      產生 Prompt
                    </button>
                    {exportPrompt && (
                      <button
                        onClick={() => copy(exportPrompt, 'export')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          copied.export ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-800'
                        }`}
                      >
                        {copied.export ? '✓ 已複製' : '複製 Prompt'}
                      </button>
                    )}
                  </div>
                  {exportPrompt && (
                    <textarea
                      value={exportPrompt}
                      readOnly
                      rows={8}
                      className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                  )}
                  <details className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-md p-3 border border-slate-200 dark:border-slate-700">
                    <summary className="cursor-pointer font-medium">📥 從 LLM 回應匯入歌詞（貼上 JSON）</summary>
                    <textarea
                      rows={5}
                      placeholder='貼上 LLM 回傳的 JSON：{"sections": [...]}'
                      onChange={(e) => {
                        if (e.target.value.trim().length > 10) {
                          handleImportFromJson(e.target.value);
                        }
                      }}
                      className="w-full mt-2 p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                    />
                  </details>
                </div>
              )}

              {aiMode === 'api' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">提供商</label>
                      <select
                        value={aiProvider}
                        onChange={(e) => {
                          setAiProvider(e.target.value);
                          setApiModel('');
                          setApiBaseUrl('');
                        }}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm"
                      >
                        {Object.entries(PROVIDERS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                        Model（預設：{PROVIDERS[aiProvider].defaultModel}）
                      </label>
                      <input
                        type="text"
                        value={apiModel}
                        onChange={(e) => setApiModel(e.target.value)}
                        placeholder={PROVIDERS[aiProvider].defaultModel}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                      API Key（存於本機 localStorage）
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                      Base URL（選填，預設：{PROVIDERS[aiProvider].baseUrl}）
                    </label>
                    <input
                      type="text"
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                      placeholder={PROVIDERS[aiProvider].baseUrl}
                      className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-mono"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={useStreaming}
                      onChange={(e) => setUseStreaming(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    Streaming（即時顯示生成內容，可中斷）
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleApiGenerate}
                      disabled={generating}
                      className={`flex-1 py-2.5 rounded-md text-sm font-medium ${
                        generating
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {generating ? '🔄 生成中...' : '🚀 一鍵生成歌詞'}
                    </button>
                    {generating && streamCtrl && (
                      <button
                        onClick={handleAbort}
                        className="px-4 py-2.5 rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700"
                      >
                        ⏹ 中止
                      </button>
                    )}
                  </div>
                  {streamText && generating && (
                    <details open className="text-xs">
                      <summary className="cursor-pointer text-slate-500">
                        即時輸出（{streamText.length} 字）
                      </summary>
                      <pre className="mt-1 p-2 bg-slate-900 text-emerald-300 rounded overflow-auto max-h-48 text-xs whitespace-pre-wrap break-words">
                        {streamText}
                      </pre>
                    </details>
                  )}
                  <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                    ⚠️ API key 以明文存於 localStorage，僅在自己電腦使用
                  </div>
                </div>
              )}

              {aiMode === 'template' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    純前端詞庫填空，依當前情緒（{state.moods[0] || '希望'}）挑選意象詞 + 你的關鍵字組合。
                  </p>
                  {!['華語(繁體)', '華語(簡體)'].includes(state.language) &&
                    state.language !== '純樂器(無歌詞)' && (
                      <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                        ⚠️ 本地模板僅支援中文。當前語言：{state.language}
                      </div>
                    )}
                  <button
                    onClick={handleTemplateGenerate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                  >
                    🎲 產生草稿
                  </button>
                </div>
              )}

              {genError && (
                <div className="mt-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 p-2 rounded border border-rose-200 dark:border-rose-800">
                  {genError}
                </div>
              )}
              {genSuccess && (
                <div className="mt-3 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded border border-emerald-300 dark:border-emerald-800 font-medium">
                  {genSuccess}
                </div>
              )}
            </SectionBlock>

            <SectionBlock
              id="section-structure"
              title="🧱 段落結構"
              hint="選擇骨架後可自由增刪、調整段落內容"
            >
              <div className="mb-3">
                <SingleSelect options={STRUCTURE_TEMPLATES} value={state.structureName} onChange={applyStructure} />
              </div>

              <div className="space-y-3">
                {state.sections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap gap-2 mb-2 items-center">
                      <input
                        type="text"
                        value={sec.tag}
                        onChange={(e) => updateSection(idx, 'tag', e.target.value)}
                        className="px-2 py-1 text-sm font-semibold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 w-28 sm:w-32"
                      />
                      <input
                        type="text"
                        value={sec.desc}
                        onChange={(e) => updateSection(idx, 'desc', e.target.value)}
                        className="flex-1 min-w-[120px] px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        placeholder="段落描述"
                      />
                      <button
                        onClick={() => moveSection(idx, -1)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-1"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveSection(idx, 1)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-1"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeSection(idx)}
                        className="text-rose-400 hover:text-rose-600 px-1"
                      >
                        ✕
                      </button>
                    </div>
                    <textarea
                      value={sec.lyrics}
                      onChange={(e) => updateSection(idx, 'lyrics', e.target.value)}
                      rows={3}
                      placeholder="輸入歌詞"
                      className="w-full px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                    />
                    <div className="text-xs text-slate-400 mt-1 flex justify-between">
                      <span>{sec.lyrics.length} 字</span>
                      <span>{sec.lyrics.split('\n').filter((l) => l.trim()).length} 行</span>
                    </div>
                    {sec.lyrics.trim() && <LyricsAnalyzer lyrics={sec.lyrics} tag={sec.tag} />}
                  </div>
                ))}
                <button
                  onClick={addSection}
                  className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 text-sm"
                >
                  + 新增段落
                </button>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                總字數: <span className="font-semibold">{totalLyricsChars}</span> ｜ 段落數:{' '}
                <span className="font-semibold">{state.sections.length}</span>
              </div>
            </SectionBlock>
          </div>

          {/* === 右欄 === */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-4">
              <SectionBlock title="📤 Style Prompt" hint="複製到 Suno 的 Style 欄位｜v5.5 上限約 1000 字元">
                <textarea
                  value={stylePrompt}
                  readOnly
                  rows={7}
                  className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm"
                />
                <div className="flex flex-wrap justify-between items-center mt-2 gap-2 text-xs">
                  <div className="space-x-2">
                    <span
                      className={
                        styleLen > 1000 ? 'text-rose-600 font-semibold' : 'text-slate-500 dark:text-slate-400'
                      }
                    >
                      {styleLen} 字元 {styleLen > 1000 && '(超過 1000)'}
                    </span>
                    <span className={tagCount > 20 ? 'text-amber-600' : 'text-slate-500 dark:text-slate-400'}>
                      · {tagCount} tags {tagCount > 20 && '(建議 8-15)'}
                    </span>
                  </div>
                  <button
                    onClick={() => copy(stylePrompt, 'style')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                      copied.style ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {copied.style ? '✓ 已複製' : '複製 Style'}
                  </button>
                </div>
              </SectionBlock>

              <SectionBlock title="📝 Lyrics" hint="複製到 Suno 的 Lyrics 欄位">
                <textarea
                  value={lyricsPrompt}
                  readOnly
                  rows={14}
                  className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm whitespace-pre-wrap"
                />
                <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{lyricsPrompt.length} 字元</span>
                  <button
                    onClick={() => copy(lyricsPrompt, 'lyrics')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                      copied.lyrics ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {copied.lyrics ? '✓ 已複製' : '複製 Lyrics'}
                  </button>
                </div>
              </SectionBlock>

              <SectionBlock title="📦 完整 Prompt">
                <textarea
                  value={fullPrompt}
                  readOnly
                  rows={8}
                  className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => copy(fullPrompt, 'full')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                      copied.full ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-800'
                    }`}
                  >
                    {copied.full ? '✓ 已複製' : '複製完整版'}
                  </button>
                </div>
              </SectionBlock>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <div className="font-semibold mb-2">💡 Suno v5.5 Prompt 心法</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>四層架構：Tempo+Key → 樂器 → 人聲 → 製作紋理</li>
                  <li>Negative Prompt 必加：no autotune / no synths 等</li>
                  <li>具體形容詞：fingerpicked guitar 比 guitar 強</li>
                  <li>Style 控制 1000 字內，tag 8-15 個</li>
                  <li>Subgenre &gt; 廣義 Genre</li>
                  <li>啟用 Voice Clone 時略過人聲描述</li>
                  <li>歌詞段落 [tag] 用英文，內容可用中文</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
          Suno Prompt Generator · v5.5 Optimized · {new Date().getFullYear()}
        </footer>
      </div>

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoad={handleLoadHistory}
        refreshKey={historyRefresh}
      />
    </div>
  );
}
