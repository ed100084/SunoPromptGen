import type { GenerationWorkflow } from '../../domain';

export interface WorkflowOption {
  id: GenerationWorkflow;
  label: string;
  icon: string;
  description: string;
}

export const WORKFLOWS: WorkflowOption[] = [
  { id: 'create', label: '創作新歌', icon: '✦', description: '從 Brief 建立完整歌曲方向' },
  { id: 'explore', label: '探索變體', icon: '◇', description: '保留核心，打開意外方向' },
  { id: 'edit-section', label: '修改段落', icon: '◫', description: '限定範圍調整既有歌曲' },
  { id: 'edit-lyrics', label: '修改歌詞', icon: '✎', description: '局部改詞，不重建全首' },
  { id: 'mashup', label: 'Mashup', icon: '⤨', description: '指定多個來源各自角色' },
  { id: 'sample', label: 'Sample / Beat', icon: '⌁', description: '從指定片段建立新素材' },
];

interface WorkflowPickerProps {
  value: GenerationWorkflow;
  onChange: (workflow: GenerationWorkflow) => void;
}

export function WorkflowPicker({ value, onChange }: WorkflowPickerProps) {
  return <section className="mb-6 overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl shadow-violet-900/10 dark:bg-gradient-to-br dark:from-slate-900 dark:to-violet-950">
    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Choose a creative action</p>
    <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">{WORKFLOWS.map((item) => <button key={item.id} onClick={() => onChange(item.id)} className={`rounded-2xl border p-3 text-left transition ${value === item.id ? 'border-violet-400 bg-violet-500/20 ring-2 ring-violet-400/30' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}><span className="text-xl">{item.icon}</span><strong className="mt-2 block text-sm">{item.label}</strong><span className="mt-1 block text-[11px] leading-4 text-slate-300">{item.description}</span></button>)}</div>
  </section>;
}
