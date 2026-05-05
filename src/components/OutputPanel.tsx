import { useState } from 'react';
import { Section as SectionBlock } from './Section';
import { getActiveVersion } from '../lib/sunoVersions';
import type { SongState } from '../types';

interface Props {
  state: SongState;
  stylePrompt: string;
  lyricsPrompt: string;
  fullPrompt: string;
  styleLen: number;
  tagCount: number;
  copied: Record<string, boolean>;
  onCopy: (text: string, key: string) => void;
}

type StyleViewMode = 'text' | 'layered';

/**
 * 右欄輸出區：Style / Lyrics / Full Prompt + 心法提示。
 * 字數/tag 上限與心法提示由 active Suno 版本提供。
 */
export function OutputPanel({
  state,
  stylePrompt,
  lyricsPrompt,
  fullPrompt,
  styleLen,
  tagCount,
  copied,
  onCopy,
}: Props) {
  const ver = getActiveVersion();
  const { maxStyleLength, recommendedTagRange, tagWarnThreshold } = ver.constraints;
  const [tagMin, tagMax] = recommendedTagRange;
  const [styleView, setStyleView] = useState<StyleViewMode>('text');
  const layers = ver.buildStyleLayers(state);

  return (
    <div className="lg:sticky lg:top-4">
      <SectionBlock
        title="📤 Style Prompt"
        hint={`複製到 Suno 的 Style 欄位｜${ver.label} 上限約 ${maxStyleLength} 字元`}
      >
        {/* View toggle */}
        <div className="flex gap-1 mb-2 border-b border-slate-200 dark:border-slate-700 text-xs">
          {[
            { k: 'text' as const, label: '📄 文字' },
            { k: 'layered' as const, label: '🧱 結構' },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setStyleView(t.k)}
              className={`px-3 py-1.5 border-b-2 -mb-px transition ${
                styleView === t.k
                  ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {styleView === 'text' && (
          <textarea
            value={stylePrompt}
            readOnly
            rows={7}
            className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm"
          />
        )}

        {styleView === 'layered' && (
          <div className="rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-2 space-y-2 max-h-[280px] overflow-y-auto">
            {layers.length === 0 ? (
              <div className="text-sm text-slate-400 p-2">（尚無內容）</div>
            ) : (
              layers.map((l) => (
                <div key={l.label} className="">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {l.label}
                    </span>
                    {l.hint && (
                      <span className="text-[10px] text-slate-400">{l.hint}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {l.tags.map((tag, i) => (
                      <span
                        key={`${tag}-${i}`}
                        className="inline-block px-2 py-0.5 rounded text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center mt-2 gap-2 text-xs">
          <div className="space-x-2">
            <span
              className={
                styleLen > maxStyleLength
                  ? 'text-rose-600 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }
            >
              {styleLen} 字元 {styleLen > maxStyleLength && `(超過 ${maxStyleLength})`}
            </span>
            <span
              className={
                tagCount > tagWarnThreshold ? 'text-amber-600' : 'text-slate-500 dark:text-slate-400'
              }
            >
              · {tagCount} tags{' '}
              {tagCount > tagWarnThreshold && `(建議 ${tagMin}-${tagMax})`}
            </span>
          </div>
          <button
            onClick={() => onCopy(stylePrompt, 'style')}
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
            onClick={() => onCopy(lyricsPrompt, 'lyrics')}
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
            onClick={() => onCopy(fullPrompt, 'full')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
              copied.full ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-800'
            }`}
          >
            {copied.full ? '✓ 已複製' : '複製完整版'}
          </button>
        </div>
      </SectionBlock>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
        <div className="font-semibold mb-2">💡 {ver.label} Prompt 心法</div>
        <ul className="list-disc list-inside space-y-1">
          {ver.promptTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
