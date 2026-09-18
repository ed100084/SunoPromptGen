import { useEffect, useMemo, useState } from 'react';
import {
  compareGenerationRuns,
  type GenerationRun,
  type GenerationRunStatus,
  type Revision,
} from '../../domain';
import {
  draftFromGenerationRun,
  EMPTY_GENERATION_RUN_DRAFT,
  GENERATION_RUN_STATUSES,
  reconcileComparisonRunIds,
  toggleComparisonRunId,
  type GenerationRunDraft,
} from './GenerationRunsPanel.helpers';

export interface GenerationRunsPanelProps {
  revision: Revision;
  onAdd: (draft: GenerationRunDraft) => void;
  onUpdate: (runId: string, update: GenerationRunDraft) => void;
  onDelete: (runId: string) => void;
  onStatusChange: (runId: string, status: GenerationRunStatus) => void;
  onMarkBest: (runId: string | null) => void;
  confirmDelete?: (run: GenerationRun) => boolean;
  readOnly?: boolean;
  className?: string;
}

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-950';

function RunFields({ draft, onChange }: {
  draft: GenerationRunDraft;
  onChange: (draft: GenerationRunDraft) => void;
}) {
  return <div className="space-y-2">
    <textarea aria-label="實際 submitted prompt" value={draft.submittedPrompt} onChange={(event) => onChange({ ...draft, submittedPrompt: event.target.value })} rows={3} placeholder="實際 submitted prompt" className={inputClass} />
    <input aria-label="音檔 URL" value={draft.audioUrl} onChange={(event) => onChange({ ...draft, audioUrl: event.target.value })} placeholder="音檔 URL（選填）" className={inputClass} />
    <div className="grid grid-cols-2 gap-2">
      <select aria-label="狀態" value={draft.status} onChange={(event) => onChange({ ...draft, status: event.target.value as GenerationRunStatus })} className={inputClass}>
        {GENERATION_RUN_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <select aria-label="評分" value={draft.rating ?? ''} onChange={(event) => onChange({ ...draft, rating: event.target.value ? Number(event.target.value) as GenerationRun['rating'] : null })} className={inputClass}>
        <option value="">未評分</option>
        {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} 星</option>)}
      </select>
    </div>
    <textarea aria-label="備註" value={draft.notes} onChange={(event) => onChange({ ...draft, notes: event.target.value })} rows={2} placeholder="備註" className={inputClass} />
  </div>;
}

function ComparisonColumn({ label, run }: { label: string; run: GenerationRun }) {
  return <div className="min-w-0 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
    <strong className="text-xs text-violet-600">{label} · {run.isBest ? '最佳結果' : run.status}</strong>
    <p className="mt-2 whitespace-pre-wrap break-words text-xs">{run.submittedPrompt || '未保存 submitted prompt'}</p>
    <dl className="mt-3 space-y-1 text-[11px] text-slate-500">
      <div><dt className="inline font-semibold">模型：</dt><dd className="inline">{run.model}</dd></div>
      <div><dt className="inline font-semibold">工作流：</dt><dd className="inline">{run.workflow}</dd></div>
      <div><dt className="inline font-semibold">評分：</dt><dd className="inline">{run.rating ?? '—'}</dd></div>
      <div><dt className="inline font-semibold">備註：</dt><dd className="inline">{run.notes || '—'}</dd></div>
    </dl>
  </div>;
}

export function GenerationRunsPanel({
  revision,
  onAdd,
  onUpdate,
  onDelete,
  onStatusChange,
  onMarkBest,
  confirmDelete = () => true,
  readOnly = false,
  className = '',
}: GenerationRunsPanelProps) {
  const [newDraft, setNewDraft] = useState<GenerationRunDraft>({ ...EMPTY_GENERATION_RUN_DRAFT });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<GenerationRunDraft | null>(null);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);

  useEffect(() => {
    setEditingId(null);
    setEditDraft(null);
    setComparisonIds((ids) => reconcileComparisonRunIds(ids, revision));
  }, [revision.id, revision.generationRuns]);

  const comparison = useMemo(() => {
    const validIds = reconcileComparisonRunIds(comparisonIds, revision);
    return validIds.length === 2
      ? compareGenerationRuns(revision, validIds[0], validIds[1])
      : null;
  }, [comparisonIds, revision]);

  const submitNew = () => {
    onAdd({ ...newDraft });
    setNewDraft({ ...EMPTY_GENERATION_RUN_DRAFT });
  };

  return <section className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}>
    <div className="mb-3 flex items-center justify-between gap-3">
      <div><h2 className="font-bold">Generation Runs</h2><p className="text-[11px] text-slate-500">保存提交內容、結果狀態與 A/B 比較。</p></div>
      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] dark:bg-slate-800">{revision.generationRuns.length} 筆</span>
    </div>

    {!readOnly && <div className="mb-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <p className="mb-2 text-xs font-bold">新增 Generation Run</p>
      <RunFields draft={newDraft} onChange={setNewDraft} />
      <button type="button" onClick={submitNew} className="mt-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white">新增紀錄</button>
    </div>}

    <div className="space-y-2">
      {revision.generationRuns.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700">尚無 Generation Run。</p>}
      {[...revision.generationRuns].reverse().map((run) => {
        const editing = editingId === run.id && editDraft;
        return <article key={run.id} className={`rounded-xl border p-3 ${run.isBest ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-700'}`}>
          {editing ? <>
            <RunFields draft={editDraft} onChange={setEditDraft} />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { onUpdate(run.id, editDraft); setEditingId(null); setEditDraft(null); }} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">保存</button>
              <button type="button" onClick={() => { setEditingId(null); setEditDraft(null); }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700">取消</button>
            </div>
          </> : <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><strong className="text-xs">{run.model} · {run.workflow}</strong>{run.isBest && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">最佳</span>}</div>
              <span className="text-[10px] text-slate-500">{new Date(run.createdAt).toLocaleString('zh-TW')}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-700 dark:text-slate-200">{run.submittedPrompt || '未保存 submitted prompt'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <select aria-label={`切換 ${run.id} 狀態`} value={run.status} disabled={readOnly} onChange={(event) => onStatusChange(run.id, event.target.value as GenerationRunStatus)} className="rounded-md border border-slate-200 bg-transparent px-1.5 py-1 dark:border-slate-700">
                {GENERATION_RUN_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <span>{run.rating ? `${run.rating} 星` : '未評分'}</span>
              {run.audioUrl && <a href={run.audioUrl} target="_blank" rel="noreferrer" className="text-violet-600">開啟音檔</a>}
            </div>
            {run.notes && <p className="mt-2 text-[11px] text-slate-500">{run.notes}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="flex items-center gap-1 text-[11px]"><input type="checkbox" checked={comparisonIds.includes(run.id)} onChange={() => setComparisonIds((ids) => toggleComparisonRunId(ids, run.id))} />A/B</label>
              {!readOnly && <button type="button" onClick={() => onMarkBest(run.isBest ? null : run.id)} className="rounded-md border border-amber-300 px-2 py-1 text-[11px] text-amber-700">{run.isBest ? '取消最佳' : '標示最佳'}</button>}
              {!readOnly && <button type="button" onClick={() => { setEditingId(run.id); setEditDraft(draftFromGenerationRun(run)); }} className="rounded-md border border-slate-300 px-2 py-1 text-[11px] dark:border-slate-700">編輯</button>}
              {!readOnly && <button type="button" onClick={() => { if (confirmDelete(run)) onDelete(run.id); }} className="rounded-md border border-rose-300 px-2 py-1 text-[11px] text-rose-600">刪除</button>}
            </div>
          </>}
        </article>;
      })}
    </div>

    {comparison && <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
      <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-bold">A/B 比較</h3><button type="button" onClick={() => setComparisonIds([])} className="text-[11px] text-slate-500">清除</button></div>
      <div className="grid gap-2 sm:grid-cols-2"><ComparisonColumn label="A" run={comparison.left} /><ComparisonColumn label="B" run={comparison.right} /></div>
    </div>}
  </section>;
}
