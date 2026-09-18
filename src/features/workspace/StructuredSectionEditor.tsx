import {
  createStructuredSection,
  structuredSectionsReducer,
  type StructuredSection,
  type StructuredSectionAction,
  type StructuredSectionEditableField,
} from './StructuredSectionEditor.helpers';

export type { StructuredSection } from './StructuredSectionEditor.helpers';

export interface StructuredSectionEditorProps {
  sections: StructuredSection[];
  onChange: (sections: StructuredSection[]) => void;
  createId?: () => string;
  addLabel?: string;
  emptyMessage?: string;
}

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-800';
const iconButtonClass = 'rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:text-slate-300';

function defaultCreateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `section-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function StructuredSectionEditor({
  sections,
  onChange,
  createId = defaultCreateId,
  addLabel = '新增段落',
  emptyMessage = '尚未建立段落。',
}: StructuredSectionEditorProps) {
  const dispatch = (action: StructuredSectionAction) => {
    const next = structuredSectionsReducer(sections, action);
    if (next !== sections) onChange(next);
  };

  const update = (
    id: string,
    field: StructuredSectionEditableField,
    value: string | boolean,
  ) => dispatch({ type: 'update', id, field, value });

  return <section className="space-y-3" aria-label="歌曲段落編輯器">
    {sections.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">{emptyMessage}</p>}

    {sections.map((section, index) => {
      const previousLocked = index > 0 && sections[index - 1].locked;
      const nextLocked = index < sections.length - 1 && sections[index + 1].locked;
      const editingDisabled = section.locked;

      return <article key={section.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <strong className="text-sm text-slate-700 dark:text-slate-200">段落 {index + 1}</strong>
          <div className="flex items-center gap-1.5">
            <button type="button" className={iconButtonClass} aria-label={`上移 ${section.name || `段落 ${index + 1}`}`} disabled={editingDisabled || index === 0 || previousLocked} onClick={() => dispatch({ type: 'move', id: section.id, direction: 'up' })}>↑</button>
            <button type="button" className={iconButtonClass} aria-label={`下移 ${section.name || `段落 ${index + 1}`}`} disabled={editingDisabled || index === sections.length - 1 || nextLocked} onClick={() => dispatch({ type: 'move', id: section.id, direction: 'down' })}>↓</button>
            <button type="button" className={`${iconButtonClass} hover:border-rose-300 hover:text-rose-600`} disabled={editingDisabled} onClick={() => dispatch({ type: 'remove', id: section.id })}>刪除</button>
            <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={section.locked} onChange={(event) => update(section.id, 'locked', event.target.checked)} />
              鎖定
            </label>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Name / tag</span>
            <input className={inputClass} disabled={editingDisabled} value={section.name} onChange={(event) => update(section.id, 'name', event.target.value)} placeholder="Verse、Chorus、Bridge…" />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Energy</span>
            <input className={inputClass} disabled={editingDisabled} value={section.energy} onChange={(event) => update(section.id, 'energy', event.target.value)} placeholder="low、building、explosive…" />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300 md:col-span-2">
            <span>Role / description</span>
            <textarea className={inputClass} disabled={editingDisabled} rows={2} value={section.role} onChange={(event) => update(section.id, 'role', event.target.value)} placeholder="此段在歌曲中的敘事或編曲角色" />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300 md:col-span-2">
            <span>Instrumentation</span>
            <textarea className={inputClass} disabled={editingDisabled} rows={2} value={section.instrumentation} onChange={(event) => update(section.id, 'instrumentation', event.target.value)} placeholder="樂器、音色、演奏方式與進場時機" />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300 md:col-span-2">
            <span>Lyrics</span>
            <textarea className={inputClass} disabled={editingDisabled} rows={5} value={section.lyrics} onChange={(event) => update(section.id, 'lyrics', event.target.value)} placeholder="輸入此段歌詞" />
          </label>
        </div>
      </article>;
    })}

    <button type="button" className="w-full rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-bold text-slate-500 transition hover:border-violet-400 hover:text-violet-700 dark:border-slate-700 dark:text-slate-400" onClick={() => dispatch({ type: 'add', section: createStructuredSection(createId()) })}>＋ {addLabel}</button>
  </section>;
}
