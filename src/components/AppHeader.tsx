import type { Theme } from '../hooks/useTheme';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  onOpenHistory: () => void;
  onSaveHistory: () => void;
}

export function AppHeader({ theme, onToggleTheme, onOpenHistory, onSaveHistory }: Props) {
  return (
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
          onClick={onOpenHistory}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
          title="歷史紀錄"
        >
          📜
        </button>
        <button
          onClick={onSaveHistory}
          className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          title="儲存當前到歷史"
        >
          💾
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
