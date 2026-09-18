import { V6_PRESETS, type V6Preset, type V6PresetId } from '../presets';

export interface PresetPickerProps {
  value?: V6PresetId | null;
  onSelect: (preset: V6Preset) => void;
  presets?: readonly V6Preset[];
  disabled?: boolean;
  className?: string;
}

const levelWidth: Record<V6Preset['energyArc']['stages'][number]['level'], string> = {
  'very-low': 'w-1/5',
  low: 'w-2/5',
  medium: 'w-3/5',
  high: 'w-4/5',
  peak: 'w-full',
};

export function PresetPicker({
  value = null,
  onSelect,
  presets = V6_PRESETS,
  disabled = false,
  className = '',
}: PresetPickerProps) {
  return <section className={`rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 ${className}`} aria-label="v6 創作 Preset">
    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">v6-first presets</p>
      <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">從完整創作方向開始</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">一次帶入 brief、段落、演唱方向、能量弧線與建議策略。</p>
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {presets.map((preset) => {
        const selected = value === preset.id;
        return <button
          key={preset.id}
          type="button"
          disabled={disabled}
          aria-pressed={selected}
          onClick={() => onSelect(preset)}
          className={`group rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${selected
            ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100 dark:bg-violet-950/30 dark:ring-violet-950'
            : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-violet-700 dark:hover:bg-slate-800/70'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <strong className="text-sm text-slate-900 dark:text-white">{preset.name}</strong>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{preset.shortDescription}</p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{preset.recommendation.model}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">{preset.tags.map((tag) => <span key={tag} className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">{tag}</span>)}</div>

          <div className="mt-4 space-y-1.5" aria-label={`${preset.name} 能量弧線`}>
            {preset.energyArc.stages.map((stage) => <div key={`${stage.section}-${stage.level}`} className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
              <span className="truncate text-[10px] text-slate-500 dark:text-slate-400">{stage.section}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><span className={`block h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 ${levelWidth[stage.level]}`} /></span>
            </div>)}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] dark:border-slate-800">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{preset.recommendation.workflow}</span>
            <span className="text-violet-600 opacity-0 transition group-hover:opacity-100 dark:text-violet-300">套用方向 →</span>
          </div>
        </button>;
      })}
    </div>
  </section>;
}
