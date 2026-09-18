import { useEffect, useState } from 'react';
import type { Revision, SongProject, StructuredChange } from '../../domain';

interface ProjectSidebarProps {
  projects: SongProject[];
  activeProjectId: string | null;
  activeProject?: SongProject;
  changes: StructuredChange[];
  onNewProject: () => void;
  onLoadProject: (project: SongProject) => void;
  onLoadRevision: (revision: Revision) => void;
  onEvaluateRevision: (rating: 1 | 2 | 3 | 4 | 5, notes: string, audioUrl?: string) => void;
  onDeleteProject: () => void;
  onDeleteRevision: () => void;
  onExportAll: () => void;
  onImport: (file: File) => void;
  dirty: boolean;
  statusMessage: string;
}

export function ProjectSidebar(props: ProjectSidebarProps) {
  const {
    projects, activeProjectId, activeProject, changes, onNewProject, onLoadProject,
    onLoadRevision, onEvaluateRevision, onDeleteProject, onDeleteRevision,
    onExportAll, onImport, dirty, statusMessage,
  } = props;
  const activeRevision = activeProject?.revisions.find((revision) => revision.id === activeProject.activeRevisionId);
  const runs = activeRevision?.generationRuns ?? [];
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [audioUrl, setAudioUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setRating(5);
    setAudioUrl('');
    setNotes('');
  }, [activeProjectId, activeProject?.activeRevisionId]);

  return <aside className="space-y-4">
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <div><h2 className="font-bold">Projects</h2>{dirty && <span className="text-[10px] font-semibold text-amber-600">● 尚未儲存</span>}</div>
        <button onClick={onNewProject} className="rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white">＋ 新專案</button>
      </div>
      <div className="space-y-2">
        {projects.length === 0 && <p className="text-xs leading-5 text-slate-500">儲存第一個版本後，會在此建立創作譜系。</p>}
        {projects.map((project) => {
          const revision = project.revisions.find((item) => item.id === project.activeRevisionId);
          return <button key={project.id} onClick={() => onLoadProject(project)} className={`w-full rounded-xl border p-3 text-left ${activeProjectId === project.id ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'border-slate-200 dark:border-slate-700'}`}>
            <strong className="block truncate text-sm">{revision?.brief.title || '未命名作品'}</strong>
            <span className="mt-1 block text-xs text-slate-500">{project.revisions.length} revisions · {revision?.generationTarget.model}</span>
          </button>;
        })}
      </div>
    </div>

    {activeProject && activeRevision && <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 font-bold">Revision timeline</h2>
      <div className="space-y-2">{activeProject.revisions.map((revision, index) => <button key={revision.id} onClick={() => onLoadRevision(revision)} className={`w-full rounded-xl border p-2.5 text-left text-xs ${revision.id === activeProject.activeRevisionId ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'border-slate-200 dark:border-slate-700'}`}>
        <strong>v{index + 1} · {revision.generationTarget.workflow}</strong>
        <span className="mt-1 block text-slate-500">{revision.generationTarget.model} · {new Date(revision.createdAt).toLocaleString('zh-TW')}</span>
      </button>)}</div>

      <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
        <p className="mb-2 text-xs font-bold">記錄 Generation Run</p>
        <div className="mb-2 flex gap-1">{([1, 2, 3, 4, 5] as const).map((value) => <button key={value} onClick={() => setRating(value)} className={`text-lg ${value <= rating ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} aria-label={`${value} 星`}>★</button>)}</div>
        <input value={audioUrl} onChange={(event) => setAudioUrl(event.target.value)} placeholder="Suno 音檔 URL（選填）" className="mb-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="這次生成的備註" className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
        <button onClick={() => { onEvaluateRevision(rating, notes, audioUrl); setAudioUrl(''); setNotes(''); }} className="mt-2 w-full rounded-lg bg-emerald-600 px-2 py-2 text-xs font-semibold text-white">記錄結果</button>
        {runs.length > 0 && <div className="mt-3 space-y-2">{[...runs].reverse().slice(0, 5).map((run) => <div key={run.id} className="rounded-lg bg-slate-50 p-2 text-[11px] dark:bg-slate-800"><div className="flex justify-between"><strong>{'★'.repeat(run.rating ?? 0) || '未評分'}</strong><span>{run.status}</span></div>{run.audioUrl && <a href={run.audioUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-violet-600">開啟音檔</a>}{run.notes && <p className="mt-1 text-slate-500">{run.notes}</p>}</div>)}</div>}
      </div>

      <div className="mt-4 flex gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
        <button onClick={onDeleteRevision} className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600">刪除版本</button>
        <button onClick={onDeleteProject} className="rounded-lg bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white">刪除專案</button>
      </div>
      {changes.length > 0 && <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700"><p className="mb-2 text-xs font-bold">相對上一版</p>{changes.slice(0, 5).map((change) => <div key={change.field} className="mb-2 text-[11px]"><strong>{change.field}</strong><div className="text-rose-500 line-through">{change.before || '—'}</div><div className="text-emerald-600">{change.after || '—'}</div></div>)}</div>}
    </div>}

    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 font-bold">備份與還原</h2>
      <div className="grid grid-cols-2 gap-2"><button onClick={onExportAll} disabled={projects.length === 0} className="rounded-lg border border-slate-300 px-2 py-2 text-xs font-semibold disabled:opacity-40 dark:border-slate-700">匯出全部</button><label className="cursor-pointer rounded-lg bg-slate-800 px-2 py-2 text-center text-xs font-semibold text-white">匯入備份<input type="file" accept="application/json,.json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.currentTarget.value = ''; }} /></label></div>
      {statusMessage && <p role="status" className="mt-3 rounded-lg bg-slate-100 p-2 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{statusMessage}</p>}
    </div>
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><strong className="mb-1 block">素材權利提醒</strong>使用音訊、圖片或歌詞作為參考前，請確認你擁有或獲准使用。此工具只產生指令，不會直接呼叫 Suno。</div>
  </aside>;
}
