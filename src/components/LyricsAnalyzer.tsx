import { useMemo } from 'react';
import { analyzeRhyme } from '../lib/rhyme';
import { analyzeLyrics } from '../lib/analyze';

interface Props {
  lyrics: string;
  /** 第幾段（用於識別 chorus 之類） */
  tag?: string;
}

const RHYME_COLORS = [
  'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
];

export function LyricsAnalyzer({ lyrics }: Props) {
  const rhyme = useMemo(() => analyzeRhyme(lyrics), [lyrics]);
  const stat = useMemo(() => analyzeLyrics(lyrics), [lyrics]);

  if (!lyrics.trim() || rhyme.lines.length === 0) {
    return null;
  }

  // letter (A/B/C..) → color class
  const letterColor: Record<string, string> = {};
  let i = 0;
  for (const letter of Object.values(rhyme.rhymeMap)) {
    if (!letterColor[letter]) {
      letterColor[letter] = RHYME_COLORS[i % RHYME_COLORS.length];
      i++;
    }
  }

  // sparkline 字數視覺化
  const counts = stat.lines.map((l) => (l.cnCount > 0 ? l.cnCount : l.charCount));
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 text-xs">
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-slate-600 dark:text-slate-300">
        <span>
          押韻：<span className="font-mono font-semibold">{rhyme.pattern || '-'}</span>
        </span>
        <span>
          均值：{stat.avgChars.toFixed(1)} 字
        </span>
        <span className={stat.isUneven ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
          標準差：{stat.stdDev.toFixed(1)}
          {stat.isUneven && ' ⚠ 不均'}
        </span>
        {stat.duplicateLines.length > 0 && (
          <span className="text-emerald-600 dark:text-emerald-400">
            ✓ 重複句 {stat.duplicateLines.length}
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        {rhyme.lines.map((line, idx) => {
          const letter = rhyme.pattern[idx];
          const color = letter !== '-' ? letterColor[letter] : '';
          const count = counts[idx];
          const barW = Math.max((count / maxCount) * 100, 8);
          return (
            <div key={idx} className="flex items-center gap-2 group">
              {/* 押韻字母 */}
              <span
                className={`w-5 h-5 inline-flex items-center justify-center rounded text-[10px] font-bold ${color || 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                title={rhyme.rhymeGroups[idx] || '無漢字'}
              >
                {letter}
              </span>
              {/* 字數 sparkline */}
              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
                <div
                  className="h-full bg-indigo-400 dark:bg-indigo-500"
                  style={{ width: `${barW}%` }}
                />
              </div>
              <span className="w-6 text-right text-slate-500 tabular-nums">{count}</span>
              {/* 行尾字 */}
              <span className="text-slate-700 dark:text-slate-300 truncate flex-1">
                {line}
                {rhyme.endChars[idx] && (
                  <span className={`ml-1 px-1 rounded ${color || ''}`}>
                    {rhyme.endChars[idx]}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
