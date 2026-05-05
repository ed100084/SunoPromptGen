import type { Suggestion } from '../lib/tagSuggestions';

interface Props {
  suggestions: Suggestion[];
  /** 點擊時把 tag 加入選擇。 */
  onPick: (tag: string) => void;
  /** 顏色主題（與所屬欄位一致）。 */
  color: 'rose' | 'emerald' | 'indigo' | 'amber' | 'red';
}

const COLOR_MAP: Record<Props['color'], string> = {
  rose: 'border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30',
  emerald:
    'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
  indigo:
    'border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
  amber:
    'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30',
  red: 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30',
};

/**
 * 顯示「💡 常搭配」推薦條 — 點擊 chip 即可加入該欄位選擇。
 */
export function SuggestionStrip({ suggestions, onPick, color }: Props) {
  if (suggestions.length === 0) return null;
  const cls = COLOR_MAP[color];

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-slate-500 dark:text-slate-400">💡 常搭配</span>
      {suggestions.map((s) => (
        <button
          key={s.tag}
          type="button"
          onClick={() => onPick(s.tag)}
          title={`共現 ${s.coCount} 次｜信心 ${(s.confidence * 100).toFixed(0)}%`}
          className={`px-2 py-0.5 rounded border bg-white dark:bg-slate-800 transition ${cls}`}
        >
          + {s.tag}
        </button>
      ))}
    </div>
  );
}
