import { useMemo, useState } from 'react';
import { SCENARIOS, STRUCTURE_TEMPLATES } from './data';
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
import { useApiSettings } from './hooks/useApiSettings';
import { HistoryDrawer } from './components/HistoryDrawer';
import { AppHeader } from './components/AppHeader';
import { StyleBuilderPanel } from './components/StyleBuilderPanel';
import { AiGeneratorPanel } from './components/AiGeneratorPanel';
import { SectionsEditor } from './components/SectionsEditor';
import { OutputPanel } from './components/OutputPanel';

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
  const {
    provider: aiProvider,
    apiKey,
    model: apiModel,
    baseUrl: apiBaseUrl,
    setProvider: setAiProvider,
    setApiKey,
    setModel: setApiModel,
    setBaseUrl: setApiBaseUrl,
    persist: persistApiSettings,
  } = useApiSettings();
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
      persistApiSettings();
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
        <AppHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenHistory={() => setHistoryOpen(true)}
          onSaveHistory={handleSaveHistory}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* === 左欄 === */}
          <div className="lg:col-span-7">
            <StyleBuilderPanel
              state={state}
              scenario={scenario}
              onApplyScenario={applyScenario}
              onUpdate={update}
            />

            <AiGeneratorPanel
              state={state}
              onUpdate={update}
              aiMode={aiMode}
              onAiModeChange={setAiMode}
              aiProvider={aiProvider}
              apiKey={apiKey}
              apiModel={apiModel}
              apiBaseUrl={apiBaseUrl}
              setAiProvider={setAiProvider}
              setApiKey={setApiKey}
              setApiModel={setApiModel}
              setApiBaseUrl={setApiBaseUrl}
              useStreaming={useStreaming}
              setUseStreaming={setUseStreaming}
              generating={generating}
              exportPrompt={exportPrompt}
              streamText={streamText}
              streamCtrlActive={streamCtrl !== null}
              copied={copied}
              onCopy={copy}
              genError={genError}
              genSuccess={genSuccess}
              onExportPrompt={handleExportPrompt}
              onApiGenerate={handleApiGenerate}
              onAbort={handleAbort}
              onTemplateGenerate={handleTemplateGenerate}
              onImportFromJson={handleImportFromJson}
            />

            <SectionsEditor
              sections={state.sections}
              structureName={state.structureName}
              totalLyricsChars={totalLyricsChars}
              onApplyStructure={applyStructure}
              onUpdateSection={updateSection}
              onAddSection={addSection}
              onRemoveSection={removeSection}
              onMoveSection={moveSection}
            />
          </div>

          {/* === 右欄 === */}
          <div className="lg:col-span-5">
            <OutputPanel
              stylePrompt={stylePrompt}
              lyricsPrompt={lyricsPrompt}
              fullPrompt={fullPrompt}
              styleLen={styleLen}
              tagCount={tagCount}
              copied={copied}
              onCopy={copy}
            />
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
