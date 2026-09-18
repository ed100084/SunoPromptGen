import type { SunoV6Model } from '../../domain';

const MODELS: Array<{ id: SunoV6Model; title: string; description: string; access: string }> = [
  { id: 'v6', title: 'Precision', description: '精準遵循完整音樂視野，適合正式版本。', access: 'Pro / Premier' },
  { id: 'v6-wild', title: 'Explore', description: '允許大膽、意外但仍連貫的變化。', access: 'Pro / Premier' },
  { id: 'v6-mini', title: 'Draft', description: '快速驗證核心概念，Prompt 會自動精簡。', access: '所有方案' },
];

interface ModelStrategyPickerProps {
  value: SunoV6Model;
  onChange: (model: SunoV6Model) => void;
}

export function ModelStrategyPicker({ value, onChange }: ModelStrategyPickerProps) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-wider text-violet-600">01 · Generation strategy</p><h2 className="mt-1 text-xl font-bold">這一輪要精準、探索，還是快速驗證？</h2></div>
    <div className="grid gap-3 md:grid-cols-3">{MODELS.map((model) => <button key={model.id} onClick={() => onChange(model.id)} className={`rounded-2xl border p-4 text-left ${value === model.id ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100 dark:bg-violet-950/30 dark:ring-violet-950' : 'border-slate-200 dark:border-slate-700'}`}><div className="flex justify-between gap-2"><strong>{model.id}</strong><span className="text-[10px] text-slate-500">{model.access}</span></div><div className="mt-1 text-sm font-semibold text-violet-700 dark:text-violet-300">{model.title}</div><p className="mt-2 text-xs leading-5 text-slate-500">{model.description}</p></button>)}</div>
  </div>;
}
