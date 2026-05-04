import { STRUCTURE_TEMPLATES } from '../data';
import type { Section } from '../types';
import { Section as SectionBlock } from './Section';
import { SingleSelect } from './SingleSelect';
import { LyricsAnalyzer } from './LyricsAnalyzer';

interface Props {
  sections: Section[];
  structureName: string;
  totalLyricsChars: number;
  onApplyStructure: (name: string) => void;
  onUpdateSection: (idx: number, field: keyof Section, value: string) => void;
  onAddSection: () => void;
  onRemoveSection: (idx: number) => void;
  onMoveSection: (idx: number, dir: number) => void;
}

/**
 * 段落結構編輯器：選擇骨架 + 增刪/調整段落 + 即時押韻分析。
 */
export function SectionsEditor({
  sections,
  structureName,
  totalLyricsChars,
  onApplyStructure,
  onUpdateSection,
  onAddSection,
  onRemoveSection,
  onMoveSection,
}: Props) {
  return (
    <SectionBlock
      id="section-structure"
      title="🧱 段落結構"
      hint="選擇骨架後可自由增刪、調整段落內容"
    >
      <div className="mb-3">
        <SingleSelect options={STRUCTURE_TEMPLATES} value={structureName} onChange={onApplyStructure} />
      </div>

      <div className="space-y-3">
        {sections.map((sec, idx) => (
          <div
            key={idx}
            className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900"
          >
            <div className="flex flex-wrap gap-2 mb-2 items-center">
              <input
                type="text"
                value={sec.tag}
                onChange={(e) => onUpdateSection(idx, 'tag', e.target.value)}
                className="px-2 py-1 text-sm font-semibold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 w-28 sm:w-32"
              />
              <input
                type="text"
                value={sec.desc}
                onChange={(e) => onUpdateSection(idx, 'desc', e.target.value)}
                className="flex-1 min-w-[120px] px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                placeholder="段落描述"
              />
              <button
                onClick={() => onMoveSection(idx, -1)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-1"
              >
                ↑
              </button>
              <button
                onClick={() => onMoveSection(idx, 1)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-1"
              >
                ↓
              </button>
              <button
                onClick={() => onRemoveSection(idx)}
                className="text-rose-400 hover:text-rose-600 px-1"
              >
                ✕
              </button>
            </div>
            <textarea
              value={sec.lyrics}
              onChange={(e) => onUpdateSection(idx, 'lyrics', e.target.value)}
              rows={3}
              placeholder="輸入歌詞"
              className="w-full px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            />
            <div className="text-xs text-slate-400 mt-1 flex justify-between">
              <span>{sec.lyrics.length} 字</span>
              <span>{sec.lyrics.split('\n').filter((l) => l.trim()).length} 行</span>
            </div>
            {sec.lyrics.trim() && <LyricsAnalyzer lyrics={sec.lyrics} tag={sec.tag} />}
          </div>
        ))}
        <button
          onClick={onAddSection}
          className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 text-sm"
        >
          + 新增段落
        </button>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        總字數: <span className="font-semibold">{totalLyricsChars}</span> ｜ 段落數:{' '}
        <span className="font-semibold">{sections.length}</span>
      </div>
    </SectionBlock>
  );
}
