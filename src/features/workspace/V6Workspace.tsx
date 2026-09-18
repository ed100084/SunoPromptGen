import { useEffect, useMemo, useReducer, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import {
  analyzeCanonicalInsights,
  compareRevisions,
  createDefaultSongProject,
  getActiveRevision,
  type Revision,
  type SongProject,
} from '../../domain';
import { compilePrompt, type GenerationTarget as CompilerTarget, type PromptSong } from '../../prompt';
import { loadProjects, saveProjects } from '../../persistence/projectStore';
import { LyricsAnalyzer } from '../../components/LyricsAnalyzer';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ModelStrategyPicker } from './ModelStrategyPicker';
import { ProjectSidebar } from './ProjectSidebar';
import { PromptPreview } from './PromptPreview';
import { WorkflowPicker, WORKFLOWS } from './WorkflowPicker';
import { LyricsAiPanel } from './LyricsAiPanel';
import { workspaceReducer, type WorkspaceDraft } from './workspaceReducer';

type Draft = WorkspaceDraft;

const DEFAULT_DRAFT: Draft = {
  title: '',
  concept: '一首關於在漫長雨季後重新找到方向的城市流行歌曲',
  language: '繁體中文',
  genres: 'mandarin contemporary pop, cinematic pop',
  moods: 'hopeful, bittersweet, warm',
  instruments: 'warm piano, restrained electronic drums, lush strings',
  vocals: 'intimate female alto, clear diction, restrained verses, soaring final chorus',
  tempo: '92 BPM, steady pulse',
  key: 'A major',
  overallFeel: '雨夜城市逐漸迎來晨光；親密、真誠，最後展開成寬廣而有希望的畫面',
  structure: 'Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Chorus, Bridge, Final Chorus, Outro',
  lyrics: '',
  avoid: 'excessive autotune, abrupt transitions, generic EDM drop',
  workflow: 'create',
  model: 'v6',
  exploration: '探索三種不同的節奏與和聲處理，但保留主題、主唱身份與副歌記憶點',
  scope: 'Chorus 2',
  preserve: '主旋律, BPM, 和弦進行, 主唱身份',
  change: '增加 gospel choir call-and-response，讓情緒更昂揚',
  sources: [
    { id: 'source-a', name: '', role: '', range: '00:00-00:30' },
    { id: 'source-b', name: '', role: '', range: '00:00-00:30' },
  ],
  rightsConfirmed: false,
};

const list = (value: string) => value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean);
const range = (value: string) => {
  const [start = '', end = ''] = value.split('-').map((part) => part.trim());
  return { start, end };
};

function toPromptSong(draft: Draft): PromptSong {
  return {
    title: draft.title,
    concept: draft.concept,
    language: draft.language,
    genres: list(draft.genres),
    moods: list(draft.moods),
    instruments: list(draft.instruments),
    vocals: list(draft.vocals),
    tempo: draft.tempo,
    key: draft.key,
    structure: list(draft.structure),
    lyrics: draft.lyrics,
    avoid: list(draft.avoid),
    notes: draft.overallFeel,
  };
}

function toCompilerTarget(draft: Draft): CompilerTarget {
  const base = { model: draft.model, song: toPromptSong(draft) };
  const edit = { scope: draft.scope, preserve: list(draft.preserve), change: list(draft.change) };
  const sources = draft.sources.map((source) => ({
    name: source.name,
    role: source.role,
    timeRange: range(source.range),
  }));
  switch (draft.workflow) {
    case 'explore': return { ...base, workflow: 'explore', exploration: draft.exploration };
    case 'edit-section': return { ...base, workflow: 'edit-section', edit };
    case 'edit-lyrics': return { ...base, workflow: 'edit-lyrics', edit };
    case 'mashup': return { ...base, workflow: 'mashup', sources };
    case 'sample': return {
      ...base,
      workflow: 'sample',
      source: sources[0] ?? { name: '', role: '', timeRange: { start: '', end: '' } },
    };
    default: return { ...base, workflow: 'create' };
  }
}

function csv(value: string[]) { return value.join(', '); }

function draftFromRevision(revision: Revision): Draft {
  return {
    ...DEFAULT_DRAFT,
    title: revision.brief.title,
    concept: revision.brief.theme || revision.brief.story || revision.brief.additionalDirection,
    language: revision.brief.language,
    genres: revision.brief.genre,
    moods: csv(revision.brief.moods),
    instruments: csv(revision.arrangement.instruments),
    vocals: revision.vocalIntent.mode === 'vocal' ? csv(revision.vocalIntent.descriptors) : '',
    tempo: revision.arrangement.bpm ? `${revision.arrangement.bpm} BPM` : '',
    key: revision.arrangement.key,
    overallFeel: revision.brief.additionalDirection,
    structure: csv(revision.arrangement.sections.map((section) => section.tag)),
    lyrics: revision.arrangement.sections.map((section) => section.lyrics).filter(Boolean).join('\n\n'),
    avoid: csv(revision.constraints.avoid),
    model: revision.generationTarget.model,
    workflow: revision.generationTarget.workflow,
    scope: revision.constraints.editScope,
    preserve: csv(revision.constraints.preserve),
    change: csv(revision.constraints.change),
    sources: revision.sourceReferences.length > 0
      ? revision.sourceReferences.map((source) => ({
          id: source.id,
          name: source.label,
          role: source.role,
          range: `${source.startTime}-${source.endTime}`,
        }))
      : DEFAULT_DRAFT.sources.map((source) => ({ ...source })),
    rightsConfirmed: revision.sourceReferences.length > 0
      && revision.sourceReferences.every((source) => source.rightsConfirmed),
  };
}

function revisionFromDraft(draft: Draft, parentRevisionId: string | null): Revision {
  const now = Date.now();
  const rendered = compilePrompt(toCompilerTarget(draft));
  return {
    id: `revision-${now}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    parentRevisionId,
    brief: {
      title: draft.title,
      language: draft.language,
      genre: list(draft.genres)[0] ?? '',
      moods: list(draft.moods),
      energy: '',
      theme: draft.concept,
      keywords: [],
      story: '',
      additionalDirection: draft.overallFeel,
    },
    arrangement: {
      bpm: Number.parseInt(draft.tempo, 10) || null,
      key: draft.key,
      structureName: 'Custom v6 plan',
      sections: list(draft.structure).map((tag) => ({ tag, description: '', lyrics: '' })),
      instruments: list(draft.instruments),
      textures: [],
      cohesion: true,
    },
    vocalIntent: { mode: draft.vocals.trim() ? 'vocal' : 'instrumental', descriptors: list(draft.vocals), useVoiceClone: false },
    sourceReferences: (draft.workflow === 'mashup' || draft.workflow === 'sample')
      ? draft.sources.slice(0, draft.workflow === 'sample' ? 1 : undefined).map((source) => {
          const timeRange = range(source.range);
          return {
            id: source.id,
            kind: 'audio' as const,
            label: source.name,
            value: '',
            role: source.role,
            startTime: timeRange.start,
            endTime: timeRange.end,
            note: '',
            rightsConfirmed: draft.rightsConfirmed,
          };
        })
      : [],
    constraints: {
      avoid: list(draft.avoid),
      mustInclude: [],
      preserve: list(draft.preserve),
      change: list(draft.change),
      editScope: draft.scope,
      maxStylePromptLength: null,
      notes: '',
    },
    generationTarget: { provider: 'suno', model: draft.model, workflow: draft.workflow, variant: null },
    renderedPrompt: {
      target: { provider: 'suno', model: draft.model, workflow: draft.workflow, variant: null },
      style: rendered.stylePrompt ?? '',
      lyrics: draft.lyrics,
      renderedAt: now,
    },
    evaluation: { rating: null, audioUrl: '', notes: '', evaluatedAt: null },
  };
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:ring-violet-950';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>{hint && <span className="mb-2 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}{children}</label>;
}

export function V6Workspace() {
  const [theme, toggleTheme] = useTheme();
  const [draft, dispatch] = useReducer(workspaceReducer, DEFAULT_DRAFT);
  const [projects, setProjects] = useState<SongProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loadProjects().then((stored) => {
      if (!cancelled) setProjects(stored);
    }).catch((error) => console.warn('[projects] load failed:', error));
    return () => { cancelled = true; };
  }, []);
  const [copied, setCopied] = useState(false);
  const rendered = useMemo(() => compilePrompt(toCompilerTarget(draft)), [draft]);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => dispatch({ type: 'set', key, value });
  const updateSource = (id: string, field: 'name' | 'role' | 'range', value: string) => {
    dispatch({ type: 'source-update', id, field, value });
  };
  const addSource = () => dispatch({
    type: 'source-add',
    source: { id: `source-${Date.now()}`, name: '', role: '', range: '00:00-00:30' },
  });
  const removeSource = (id: string) => dispatch({ type: 'source-remove', id });

  const saveRevision = () => {
    const current = projects.find((project) => project.id === activeProjectId);
    const revision = revisionFromDraft(draft, current?.activeRevisionId ?? null);
    let next: SongProject[];
    if (current) {
      next = projects.map((project) => project.id === current.id ? {
        ...project,
        updatedAt: revision.createdAt,
        activeRevisionId: revision.id,
        revisions: [...project.revisions, revision],
      } : project);
    } else {
      const project = createDefaultSongProject({ now: revision.createdAt, brief: { title: draft.title } });
      project.activeRevisionId = revision.id;
      project.revisions = [revision];
      next = [project, ...projects];
      setActiveProjectId(project.id);
    }
    setProjects(next);
    void saveProjects(next).catch((error) => console.warn('[projects] save failed:', error));
  };

  const loadProject = (project: SongProject) => {
    const revision = project.revisions.find((item) => item.id === project.activeRevisionId) ?? project.revisions.at(-1);
    if (!revision) return;
    setActiveProjectId(project.id);
    dispatch({ type: 'replace', draft: draftFromRevision(revision) });
  };

  const evaluateRevision = (rating: 1 | 2 | 3 | 4 | 5, notes: string) => {
    if (!activeProject) return;
    const now = Date.now();
    const next = projects.map((project) => project.id === activeProject.id ? {
      ...project,
      updatedAt: now,
      revisions: project.revisions.map((revision) => revision.id === project.activeRevisionId ? {
        ...revision,
        evaluation: { ...revision.evaluation, rating, notes, evaluatedAt: now },
      } : revision),
    } : project);
    setProjects(next);
    void saveProjects(next).catch((error) => console.warn('[projects] rating save failed:', error));
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(rendered.primaryPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const exportProject = () => {
    if (!activeProject) return;
    const blob = new Blob([JSON.stringify(activeProject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(draft.title || 'suno-project').replace(/[\\/:*?"<>|]/g, '')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const workflow = WORKFLOWS.find((item) => item.id === draft.workflow)!;
  const activeProject = projects.find((project) => project.id === activeProjectId);
  const activeRevision = activeProject ? getActiveRevision(activeProject) : null;
  const parentRevision = activeProject && activeRevision?.parentRevisionId
    ? activeProject.revisions.find((revision) => revision.id === activeRevision.parentRevisionId) ?? null
    : null;
  const changes = activeRevision && parentRevision ? compareRevisions(parentRevision, activeRevision) : [];
  const insights = useMemo(() => analyzeCanonicalInsights(projects), [projects]);

  return <div className="min-h-screen bg-[#f6f5fb] text-slate-900 dark:bg-[#090b13] dark:text-slate-100">
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xl text-white shadow-lg shadow-violet-500/20">♪</div><div><h1 className="font-bold tracking-tight">Suno v6 Creative Workspace</h1><p className="text-xs text-slate-500">從創作意圖到可執行指令，而不是堆疊 tags</p></div></div>
        <div className="flex items-center gap-2"><span className="hidden rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 sm:block dark:bg-emerald-950 dark:text-emerald-300">v6-first</span><ThemeToggle theme={theme} onToggle={toggleTheme} /></div>
      </div>
    </header>

    <main className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8">
      <WorkflowPicker value={draft.workflow} onChange={(value) => set('workflow', value)} />

      <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_minmax(360px,0.85fr)]">
        <div className="space-y-4">
        <ProjectSidebar
          projects={projects}
          activeProjectId={activeProjectId}
          activeProject={activeProject}
          changes={changes}
          onNewProject={() => { dispatch({ type: 'replace', draft: DEFAULT_DRAFT }); setActiveProjectId(null); }}
          onLoadProject={loadProject}
          onLoadRevision={(revision) => dispatch({ type: 'replace', draft: draftFromRevision(revision) })}
          onEvaluateRevision={evaluateRevision}
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900"><h2 className="mb-3 font-bold">Insights v2</h2><div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><strong className="block text-lg">{insights.scope.includedRevisionCount}</strong>v6 revisions</div><div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><strong className="block text-lg">{insights.ratings.average?.toFixed(1) ?? '—'}</strong>平均評分</div></div><p className="mt-2 text-slate-500">已隔離 {insights.scope.excludedMigratedCount} 個遷移專案，避免跨版本污染。</p></div>
        </div>

        <section className="space-y-5">
          <ModelStrategyPicker value={draft.model} onChange={(value) => set('model', value)} />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-semibold uppercase tracking-wider text-violet-600">02 · Creative brief</p><h2 className="mb-5 mt-1 text-xl font-bold">先說清楚要創作什麼</h2><div className="space-y-4"><Field label="作品名稱"><input className={inputClass} value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="未命名作品" /></Field><Field label="一句話創作意圖" hint="主題、情境與情緒轉變，比曲風標籤更重要"><textarea className={inputClass} rows={3} value={draft.concept} onChange={(e) => set('concept', e.target.value)} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="語言"><input className={inputClass} value={draft.language} onChange={(e) => set('language', e.target.value)} /></Field><Field label="Tempo"><input className={inputClass} value={draft.tempo} onChange={(e) => set('tempo', e.target.value)} /></Field><Field label="Genre directions"><input className={inputClass} value={draft.genres} onChange={(e) => set('genres', e.target.value)} /></Field><Field label="Mood arc"><input className={inputClass} value={draft.moods} onChange={(e) => set('moods', e.target.value)} /></Field></div><Field label="Overall feel / 場景"><textarea className={inputClass} rows={3} value={draft.overallFeel} onChange={(e) => set('overallFeel', e.target.value)} /></Field></div></div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-semibold uppercase tracking-wider text-violet-600">03 · Musical plan</p><h2 className="mb-5 mt-1 text-xl font-bold">描述角色與發展，不只列出樂器</h2><div className="space-y-4"><Field label="Instrumentation" hint="可描述樂器的角色、音色、演奏方式與進場時機"><textarea className={inputClass} rows={3} value={draft.instruments} onChange={(e) => set('instruments', e.target.value)} /></Field><Field label="Vocal direction"><textarea className={inputClass} rows={2} value={draft.vocals} onChange={(e) => set('vocals', e.target.value)} /></Field><Field label="Structure / energy arc"><textarea className={inputClass} rows={3} value={draft.structure} onChange={(e) => set('structure', e.target.value)} /></Field><Field label="Avoid" hint="只保留真正會破壞方向的限制"><input className={inputClass} value={draft.avoid} onChange={(e) => set('avoid', e.target.value)} /></Field></div></div>

          {draft.workflow === 'explore' && <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-5 dark:border-fuchsia-900 dark:bg-fuchsia-950/20"><h2 className="mb-3 font-bold">探索軸線</h2><textarea className={inputClass} rows={3} value={draft.exploration} onChange={(e) => set('exploration', e.target.value)} /></div>}
          {(draft.workflow === 'edit-section' || draft.workflow === 'edit-lyrics') && <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-900 dark:bg-sky-950/20"><h2 className="mb-4 font-bold">局部編修契約</h2><div className="space-y-4"><Field label="Scope"><input className={inputClass} value={draft.scope} onChange={(e) => set('scope', e.target.value)} /></Field><Field label="Preserve"><textarea className={inputClass} rows={2} value={draft.preserve} onChange={(e) => set('preserve', e.target.value)} /></Field><Field label="Change"><textarea className={inputClass} rows={2} value={draft.change} onChange={(e) => set('change', e.target.value)} /></Field></div></div>}
          {(draft.workflow === 'mashup' || draft.workflow === 'sample') && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/20"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">來源與角色</h2>{draft.workflow === 'mashup' && <button onClick={addSource} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white">＋ 新增來源</button>}</div><div className="space-y-3">{draft.sources.slice(0, draft.workflow === 'sample' ? 1 : undefined).map((source, index) => <div key={source.id} className="grid gap-3 rounded-xl border border-amber-200 bg-white/60 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] dark:border-amber-900 dark:bg-slate-900/40"><input className={inputClass} placeholder={`Source ${index + 1} 名稱`} value={source.name} onChange={(e) => updateSource(source.id, 'name', e.target.value)} /><input className={inputClass} placeholder="角色，例如 drums" value={source.role} onChange={(e) => updateSource(source.id, 'role', e.target.value)} /><input className={inputClass} placeholder="00:12-00:28" value={source.range} onChange={(e) => updateSource(source.id, 'range', e.target.value)} />{draft.workflow === 'mashup' && draft.sources.length > 2 && <button onClick={() => removeSource(source.id)} className="px-2 text-rose-600" aria-label={`移除來源 ${index + 1}`}>✕</button>}</div>)}</div><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.rightsConfirmed} onChange={(e) => set('rightsConfirmed', e.target.checked)} />我確認擁有或獲准使用這些來源素材</label></div>}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-semibold uppercase tracking-wider text-violet-600">04 · Lyrics</p><h2 className="mb-4 mt-1 text-xl font-bold">歌詞與局部精修</h2><textarea className={inputClass} rows={12} value={draft.lyrics} onChange={(e) => set('lyrics', e.target.value)} placeholder="可貼入既有歌詞，或留空只生成音樂方向…" />{draft.lyrics.trim() && <div className="mt-4"><LyricsAnalyzer lyrics={draft.lyrics} tag="Full Lyrics" /></div>}</div>
          <LyricsAiPanel
            lyrics={draft.lyrics}
            onApply={(lyrics) => set('lyrics', lyrics)}
            defaultTask={draft.workflow === 'edit-lyrics' ? 'edit-lyrics' : 'generate'}
            context={{
              title: draft.title,
              concept: draft.concept,
              language: draft.language,
              genres: draft.genres,
              moods: draft.moods,
              vocals: draft.vocals,
              structure: draft.structure,
              additionalDirection: draft.overallFeel,
              editScope: draft.scope,
              preserve: draft.preserve,
            }}
          />
        </section>

        <PromptPreview
          rendered={rendered}
          workflow={workflow}
          workflowId={draft.workflow}
          rightsConfirmed={draft.rightsConfirmed}
          copied={copied}
          hasActiveProject={Boolean(activeProject)}
          onCopy={copyPrompt}
          onSaveRevision={saveRevision}
          onExportProject={exportProject}
        />
      </div>
    </main>
  </div>;
}
