type ColorKey = 'indigo' | 'rose' | 'emerald' | 'amber' | 'sky' | 'slate' | 'red';

interface Props {
  options: Record<string, unknown>;
  selected: string[];
  onChange: (next: string[]) => void;
  color?: ColorKey;
}

const COLOR_MAP: Record<ColorKey, string> = {
  indigo: 'bg-indigo-600 text-white',
  rose: 'bg-rose-600 text-white',
  emerald: 'bg-emerald-600 text-white',
  amber: 'bg-amber-600 text-white',
  sky: 'bg-sky-600 text-white',
  slate: 'bg-slate-700 text-white',
  red: 'bg-red-600 text-white',
};

export function MultiSelectChips({ options, selected, onChange, color = 'indigo' }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.keys(options).map((key) => {
        const isSel = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              onChange(isSel ? selected.filter((k) => k !== key) : [...selected, key]);
            }}
            className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
              isSel
                ? `${COLOR_MAP[color]} border-transparent shadow-sm`
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
