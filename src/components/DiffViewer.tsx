import { useMemo } from 'react';
import type { HistoryEntry } from '../types';
import { diffLines, diffSongState, diffTags } from '../lib/diff';

interface Props {
  open: boolean;
  left: HistoryEntry | null;
  right: HistoryEntry | null;
  onClose: () => void;
}

/**
 * Modal：並排顯示兩筆歷史紀錄的差異。
 * - Style Prompt：tag 集合差異（增/減/相同）
 * - 段落歌詞：行級 LCS diff（綠色新增 / 紅色刪除）
 * - SongState：欄位表格，差異列高亮
 */
export function DiffViewer({ open, left, right, onClose }: Props) {
  const tagDiff = useMemo(() => {
    if (!left || !right) return null;
    return diffTags(left.stylePrompt, right.stylePrompt);
  }, [left, right]);

  const lyricsDiff = useMemo(() => {
    if (!left || !right) return null;
    return diffLines(left.lyricsPrompt, right.lyricsPrompt);
  }, [left, right]);

  const fieldDiff = useMemo(() => {
    if (!left || !right) return null;
    return diffSongState(left.state, right.state);
  }, [left, right]);

  if (!open || !left || !right) return null;

  const fmt = (ts: number) => new Date(ts).toLocaleString('zh-TW');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col">
        <header className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            🔍 Prompt 對比
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl"
            aria-label="關閉"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 兩筆紀錄表頭 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DiffHeaderCard label="A（基準）" entry={left} fmt={fmt} accent="rose" />
            <DiffHeaderCard label="B（對比）" entry={right} fmt={fmt} accent="emerald" />
          </div>

          {/* Style Prompt tag diff */}
          {tagDiff && (
            <Block title="🎵 Style Prompt — Tag 變動">
              <TagPills tags={tagDiff.removed} variant="del" prefix="−" emptyMsg="（無移除）" />
              <TagPills tags={tagDiff.added} variant="add" prefix="+" emptyMsg="（無新增）" />
              <details className="mt-3">
                <summary className="text-xs text-slate-500 cursor-pointer">
                  顯示相同 tag（{tagDiff.common.length}）
                </summary>
                <TagPills tags={tagDiff.common} variant="same" prefix="" emptyMsg="—" />
              </details>
            </Block>
          )}

          {/* Lyrics line diff */}
          {lyricsDiff && (
            <Block title="📝 Lyrics — 行級差異">
              <div className="font-mono text-xs sm:text-sm rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                {lyricsDiff.length === 0 ? (
                  <div className="p-3 text-slate-400">（無差異）</div>
                ) : (
                  lyricsDiff.map((op, i) => (
                    <DiffLineRow key={i} op={op.type} text={op.text} />
                  ))
                )}
              </div>
            </Block>
          )}

          {/* SongState 欄位表格 */}
          {fieldDiff && (
            <Block title="🎛️ 欄位變動">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      <th className="py-2 pr-2 font-medium">欄位</th>
                      <th className="py-2 px-2 font-medium">A</th>
                      <th className="py-2 px-2 font-medium">B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldDiff.map((d) => (
                      <tr
                        key={d.label}
                        className={`border-b border-slate-100 dark:border-slate-800 ${
                          d.changed ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''
                        }`}
                      >
                        <td className="py-1.5 pr-2 text-slate-600 dark:text-slate-300 align-top">
                          {d.label}
                          {d.changed && <span className="ml-1 text-amber-600">●</span>}
                        </td>
                        <td className="py-1.5 px-2 align-top text-slate-700 dark:text-slate-200 break-all">
                          {d.before || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-1.5 px-2 align-top text-slate-700 dark:text-slate-200 break-all">
                          {d.after || <span className="text-slate-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Block>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────── Subcomponents ─────────

function DiffHeaderCard({
  label,
  entry,
  fmt,
  accent,
}: {
  label: string;
  entry: HistoryEntry;
  fmt: (ts: number) => string;
  accent: 'rose' | 'emerald';
}) {
  const colors =
    accent === 'rose'
      ? 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10'
      : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10';
  return (
    <div className={`rounded-lg border p-3 ${colors}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="font-medium text-sm text-slate-800 dark:text-slate-100 mt-0.5 truncate">
        {entry.title}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{fmt(entry.savedAt)}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{title}</h3>
      {children}
    </section>
  );
}

function TagPills({
  tags,
  variant,
  prefix,
  emptyMsg,
}: {
  tags: string[];
  variant: 'add' | 'del' | 'same';
  prefix: string;
  emptyMsg: string;
}) {
  const cls =
    variant === 'add'
      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
      : variant === 'del'
      ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800 line-through'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (tags.length === 0) {
    return <div className="text-xs text-slate-400 mt-1">{emptyMsg}</div>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {tags.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className={`px-2 py-0.5 rounded text-xs border ${cls}`}
        >
          {prefix && <span className="mr-1 font-mono">{prefix}</span>}
          {t}
        </span>
      ))}
    </div>
  );
}

function DiffLineRow({ op, text }: { op: 'same' | 'add' | 'del'; text: string }) {
  if (op === 'same') {
    return (
      <div className="px-3 py-1 text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">
        <span className="inline-block w-4 text-slate-400"> </span>
        {text || ' '}
      </div>
    );
  }
  if (op === 'add') {
    return (
      <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap break-words">
        <span className="inline-block w-4 font-mono">+</span>
        {text || ' '}
      </div>
    );
  }
  return (
    <div className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200 whitespace-pre-wrap break-words">
      <span className="inline-block w-4 font-mono">−</span>
      {text || ' '}
    </div>
  );
}
