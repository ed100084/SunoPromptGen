import type { Theme } from '../hooks/useTheme';

interface Props {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
      aria-label={theme === 'dark' ? '切換淺色' : '切換深色'}
      title={theme === 'dark' ? '切換淺色' : '切換深色'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
