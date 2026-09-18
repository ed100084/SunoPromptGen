import type { Revision, SongProject, StructuredChange } from '../../domain';

interface ProjectSidebarProps {
  projects: SongProject[];
  activeProjectId: string | null;
  activeProject?: SongProject;
  changes: StructuredChange[];
  onNewProject: () => void;
  onLoadProject: (project: SongProject) => void;
  onLoadRevision: (revision: Revision) => void;
  onEvaluateRevision: (rating: 1 | 2 | 3 | 4 | 5, notes: string) => void;
  onDeleteProject: () => void;
  onDeleteRevision: () => void;
  onExportAll: () => void;
  onImport: (file: File) => void;
  dirty: boolean;
  statusMessage: string;
}

export function ProjectSidebar({
  projects,
  activeProjectId,
  activeProject,
  changes,
  onNewProject,
  onLoadProject,
  onLoadRevision,
  onEvaluateRevision,
  onDeleteProject,
  onDeleteRevision,
  onExportAll,
  onImport,
  dirty,
  statusMessage,
}: ProjectSidebarProps) {
  return <aside className="space-y-4">
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-bold">Projects</h2>{dirty && <span className="text-[10px] font-semibold text-amber-600">● 尚未儲存</span>}</div><button onClick={onNewProject} className="rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white">＋ 新專案</button></div><div className="space-y-2">{projects.length === 0 && <p className="text-xs leading-5 text-slate-500">儲存第一個版本後，會在此建立創作譜系。</p>}{projects.map((project) => { const rev = project.revisions.find((revision) => revision.id === project.activeRevisionId); return <button key={project.id} onClick={() => onLoadProject(project)} className={`w-full rounded-xl border p-3 text-left ${activeProjectId === project.id ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'border-slate-200 dark:border-slate-700'}`}><strong className="block truncate text-sm">{rev?.brief.title || '未命名作品'}</strong><span className="mt-1 block text-xs text-slate-500">{project.revisions.length} revisions · {rev?.generationTarget.model}</span></button>; })}</div></div>
    {activeProject && <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><h2 className="mb-3 font-bold">Revision timeline</h2><div className="space-y-2">{activeProject.revisions.map((revision, index) => <button key={revision.id} onClick={() => onLoadRevision(revision)} className={`w-full rounded-xl border p-2.5 text-left text-xs ${revision.id === activeProject.activeRevisionId ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'border-slate-200 dark:border-slate-700'}`}><strong>v{index + 1} · {revision.generationTarget.workflow}</strong><span className="mt-1 block text-slate-500">{revision.generationTarget.model} · {new Date(revision.createdAt).toLocaleString('zh-TW')}</span></button>)}</div><div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700"><p className="mb-2 text-xs font-bold">生成結果評分</p><div className="flex gap-1">{([1, 2, 3, 4, 5] as const).map((rating) => <button key={rating} onClick={() => onEvaluateRevision(rating, activeProject.revisions.find((revision) => revision.id === activeProject.activeRevisionId)?.evaluation.notes ?? '')} className={`text-lg ${rating <= (activeProject.revisions.find((revision) => revision.id === activeProject.activeRevisionId)?.evaluation.rating ?? 0) ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} aria-label={`${rating} 星`}>★</button>)}</div></div><div className="mt-4 flex gap-2 border-t border-slate-200 pt-3 dark:border-slate-700"><button onClick={onDeleteRevision} className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600">刪除版本</button><button onClick={onDeleteProject} className="rounded-lg bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white">刪除專案</button></div>{changes.length > 0 && <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700"><p className="mb-2 text-xs font-bold">相對上一版</p>{changes.slice(0, 5).map((change) => <div key={change.field} className="mb-2 text-[11px]"><strong>{change.field}</strong><div className="text-rose-500 line-through">{change.before || '—'}</div><div className="text-emerald-600">{change.after || '—'}</div></div>)}</div>}</div>}
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><h2 className="mb-3 font-bold">備份與還原</h2><div className="grid grid-cols-2 gap-2"><button onClick={onExportAll} disabled={projects.length === 0} className="rounded-lg border border-slate-300 px-2 py-2 text-xs font-semibold disabled:opacity-40 dark:border-slate-700">匯出全部</button><label className="cursor-pointer rounded-lg bg-slate-800 px-2 py-2 text-center text-xs font-semibold text-white">匯入備份<input type="file" accept="application/json,.json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.currentTarget.value = ''; }} /></label></div>{statusMessage && <p role="status" className="mt-3 rounded-lg bg-slate-100 p-2 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{statusMessage}</p>}</div>
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><strong className="block mb-1">素材權利提醒</strong>使用音訊、圖片或歌詞作為參考前，請確認你擁有或獲准使用。此工具只產生指令，不會直接呼叫 Suno。</div>
  </aside>;
}
