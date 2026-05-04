import { PROVIDERS } from '../data';
import type { AiMode, SongState } from '../types';
import { Section as SectionBlock } from './Section';

interface Props {
  state: SongState;
  onUpdate: <K extends keyof SongState>(key: K, value: SongState[K]) => void;

  aiMode: AiMode;
  onAiModeChange: (mode: AiMode) => void;

  // API 設定
  aiProvider: string;
  apiKey: string;
  apiModel: string;
  apiBaseUrl: string;
  setAiProvider: (v: string) => void;
  setApiKey: (v: string) => void;
  setApiModel: (v: string) => void;
  setApiBaseUrl: (v: string) => void;

  // Streaming
  useStreaming: boolean;
  setUseStreaming: (v: boolean) => void;

  // 生成狀態
  generating: boolean;
  exportPrompt: string;
  streamText: string;
  streamCtrlActive: boolean;

  // 複製狀態（共用）
  copied: Record<string, boolean>;
  onCopy: (text: string, key: string) => void;

  // 訊息
  genError: string;
  genSuccess: string;

  // Handlers
  onExportPrompt: () => void;
  onApiGenerate: () => void;
  onAbort: () => void;
  onTemplateGenerate: () => void;
  onImportFromJson: (text: string) => void;
}

/**
 * AI 歌詞生成面板：三模式（匯出 Prompt / API 直接生成 / 本地模板）。
 */
export function AiGeneratorPanel(props: Props) {
  const {
    state,
    onUpdate,
    aiMode,
    onAiModeChange,
    aiProvider,
    apiKey,
    apiModel,
    apiBaseUrl,
    setAiProvider,
    setApiKey,
    setApiModel,
    setApiBaseUrl,
    useStreaming,
    setUseStreaming,
    generating,
    exportPrompt,
    streamText,
    streamCtrlActive,
    copied,
    onCopy,
    genError,
    genSuccess,
    onExportPrompt,
    onApiGenerate,
    onAbort,
    onTemplateGenerate,
    onImportFromJson,
  } = props;

  return (
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
            onChange={(e) => onUpdate('lyricsTheme', e.target.value)}
            placeholder="例：離職送別、第一次心動"
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">關鍵字（用逗號分隔）</label>
          <input
            type="text"
            value={state.lyricsKeywords}
            onChange={(e) => onUpdate('lyricsKeywords', e.target.value)}
            placeholder="例：回憶, 感謝, 未來, 並肩"
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">故事背景（選填）</label>
          <textarea
            value={state.lyricsStory}
            onChange={(e) => onUpdate('lyricsStory', e.target.value)}
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
            onClick={() => onAiModeChange(t.k)}
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
              onClick={onExportPrompt}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              產生 Prompt
            </button>
            {exportPrompt && (
              <button
                onClick={() => onCopy(exportPrompt, 'export')}
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
                  onImportFromJson(e.target.value);
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
              onClick={onApiGenerate}
              disabled={generating}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium ${
                generating
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {generating ? '🔄 生成中...' : '🚀 一鍵生成歌詞'}
            </button>
            {generating && streamCtrlActive && (
              <button
                onClick={onAbort}
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
            onClick={onTemplateGenerate}
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
  );
}
