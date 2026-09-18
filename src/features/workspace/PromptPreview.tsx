import type { GenerationWorkflow } from '../../domain';
import type { RenderedPrompt } from '../../prompt';
import type { WorkflowOption } from './WorkflowPicker';

interface PromptPreviewProps {
  rendered: RenderedPrompt;
  workflow: WorkflowOption;
  workflowId: GenerationWorkflow;
  rightsConfirmed: boolean;
  copied: boolean;
  hasActiveProject: boolean;
  onCopy: () => void;
  onSaveRevision: () => void;
  onExportProject: () => void;
}

export function PromptPreview({
  rendered,
  workflow,
  workflowId,
  rightsConfirmed,
  copied,
  hasActiveProject,
  onCopy,
  onSaveRevision,
  onExportProject,
}: PromptPreviewProps) {
  return <aside className="xl:sticky xl:top-5 xl:self-start"><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"><div className="border-b border-slate-200 bg-gradient-to-r from-violet-600 to-fuchsia-600 p-5 text-white dark:border-slate-800"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-violet-100">Compiled instruction</p><h2 className="mt-1 text-xl font-bold">{workflow.icon} {workflow.label}</h2></div><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{rendered.model}</span></div></div><div className="p-5"><div className="mb-4 flex flex-wrap gap-2">{rendered.sections.map((section) => <span key={section.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{section.label}</span>)}</div><textarea readOnly rows={22} value={rendered.primaryPrompt} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-6 text-emerald-200 outline-none dark:border-slate-700" />{rendered.warnings.length > 0 && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><strong>送出前請確認</strong><ul className="mt-1 list-disc pl-4">{rendered.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}{(workflowId === 'mashup' || workflowId === 'sample') && !rightsConfirmed && <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">尚未確認來源素材權利。</div>}<div className="mt-4 grid grid-cols-2 gap-2"><button onClick={onCopy} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700">{copied ? '✓ 已複製' : '複製指令'}</button><button onClick={onSaveRevision} className="rounded-xl border border-violet-300 px-4 py-3 text-sm font-bold text-violet-700 dark:border-violet-700 dark:text-violet-300">儲存版本</button></div><button disabled={!hasActiveProject} onClick={onExportProject} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700">匯出專案 JSON</button></div></div></aside>;
}
