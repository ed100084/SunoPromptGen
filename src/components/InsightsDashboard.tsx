import { useMemo, useState } from 'react';
import type { HistoryEntry } from '../types';
import {
  analyzeInsights,
  classifyLift,
  type FieldInsight,
  type TagInsight,
} from '../lib/insights';

interface Props {
  open: boolean;
  entries: HistoryEntry[];
  onClose: () => void;
}

const FIELD_LABEL: Record<FieldInsight['field'], string> = {
  moods: '😌 情緒',
  instruments: '🎸 樂器',
  vocals: '🎤 人聲',
  textures: '🎚️ 紋理',
  negatives: '🚫 Negatives',
  genre: '🎼 曲風',
};

/**
 * Modal：成功 Patterns 儀表板。
 * 從歷史紀錄的評分資料分析，告訴使用者「什麼真的在你身上有用」。
 *
 * 設計原則：
 *   - lift > 0 表示這個 tag 在高分作品比整體更常出現 → 真正的成功因子
 *   - 純頻率排名沒意義（你常用什麼就會排第一）
 *   - 資料 < 3 筆高分時顯示 onboarding 訊息
 */
export function InsightsDashboard({ open, entries, onClose }: Props) {
  const [threshold, setThreshold] = useState<4 | 5>(4);
  const report = useMemo(() => analyzeInsights(entries, threshold), [entries, threshold]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        <header className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              📈 成功 Patterns 儀表板
            </h2>
            <div className="flex gap-1 text-xs">
              {[4, 5].map((t) => (
                <button
                  key={t}
                  onClick={() => setThreshold(t as 4 | 5)}
                  className={`px-2 py-0.5 rounded ${
                    threshold === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t}★+
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl"
            aria-label="關閉"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* 概覽 */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="總紀錄" value={report.totalEntries} />
            <Stat label="已評分" value={report.ratedCount} />
            <Stat label={`${threshold}★+ 紀錄`} value={report.highCount} highlight />
            <Stat
              label="評分覆蓋率"
              value={
                report.totalEntries > 0
                  ? `${Math.round((report.ratedCount / report.totalEntries) * 100)}%`
                  : '—'
              }
            />
          </section>

          {/* Rating distribution */}
          {report.ratedCount > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                評分分布
              </h3>
              <RatingBars distribution={report.ratingDistribution} max={report.ratedCount} />
            </section>
          )}

          {/* 不夠資料的 onboarding */}
          {!report.meaningful && (
            <section className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-200">
              <div className="font-medium mb-1">💡 累積更多資料以獲得有意義的洞察</div>
              <p className="text-xs">
                目前 {threshold}★+ 紀錄只有 {report.highCount} 筆。建議至少累積 3 筆高分才能看出
                pattern。每次在 Suno 生成後回來打分，工具會逐漸理解你的偏好。
              </p>
            </section>
          )}

          {/* 各欄位 top tags */}
          {report.meaningful && (
            <>
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  🏆 高分作品共通點
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  橘色 ★ 表示在高分中比整體更常出現（lift &gt; 0），是真正的成功因子。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.fields.map((f) =>
                    f.topTags.length === 0 ? null : (
                      <FieldCard key={f.field} insight={f} highCount={report.highCount} />
                    ),
                  )}
                </div>
              </section>

              {/* BPM / Style length */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.bpm && (
                  <RangeCard
                    title="🎵 BPM 甜蜜點"
                    range={`${report.bpm.highMin}–${report.bpm.highMax}`}
                    avg={`平均 ${report.bpm.highAvg.toFixed(0)}`}
                    compare={
                      report.bpm.baseAvg !== report.bpm.highAvg
                        ? `整體平均 ${report.bpm.baseAvg.toFixed(0)}`
                        : undefined
                    }
                  />
                )}
                {report.styleLength && (
                  <RangeCard
                    title="📏 Style Prompt 長度"
                    range={`${report.styleLength.highMin}–${report.styleLength.highMax} 字`}
                    avg={`平均 ${report.styleLength.highAvg.toFixed(0)} 字`}
                  />
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────── Subcomponents ─────────

function Stat({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight
          ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
      }`}
    >
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`text-2xl font-semibold mt-0.5 ${highlight ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-100'}`}>
        {value}
      </div>
    </div>
  );
}

function RatingBars({
  distribution,
  max,
}: {
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  max: number;
}) {
  const peak = Math.max(...Object.values(distribution), 1);
  return (
    <div className="space-y-1">
      {([5, 4, 3, 2, 1] as const).map((star) => {
        const count = distribution[star];
        const pct = max > 0 ? (count / max) * 100 : 0;
        const barWidth = (count / peak) * 100;
        const color = star >= 4 ? 'bg-amber-400' : star === 3 ? 'bg-slate-400' : 'bg-rose-300';
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-12 text-amber-500 font-mono">{'★'.repeat(star)}</span>
            <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${barWidth}%` }} />
            </div>
            <span className="w-16 text-right text-slate-600 dark:text-slate-300 tabular-nums">
              {count} ({pct.toFixed(0)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FieldCard({ insight, highCount }: { insight: FieldInsight; highCount: number }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
        {FIELD_LABEL[insight.field]}
      </div>
      <ul className="space-y-1.5 text-xs">
        {insight.topTags.map((t) => (
          <TagRow key={t.tag} tag={t} highCount={highCount} />
        ))}
      </ul>
    </div>
  );
}

function TagRow({ tag, highCount }: { tag: TagInsight; highCount: number }) {
  const liftLevel = classifyLift(tag.lift);
  const liftStar =
    liftLevel === 'strong'
      ? '★★'
      : liftLevel === 'mild'
      ? '★'
      : liftLevel === 'negative'
      ? '↓'
      : '';
  const liftColor =
    liftLevel === 'strong'
      ? 'text-amber-500'
      : liftLevel === 'mild'
      ? 'text-amber-400'
      : liftLevel === 'negative'
      ? 'text-rose-400'
      : 'text-slate-300';
  const pct = highCount > 0 ? (tag.highCount / highCount) * 100 : 0;

  return (
    <li className="flex items-center gap-2">
      <span
        className={`w-6 text-center font-bold ${liftColor}`}
        title={`lift ${(tag.lift * 100).toFixed(0)}%（高分中相對整體的偏好倍率）`}
      >
        {liftStar || '·'}
      </span>
      <span className="flex-1 text-slate-700 dark:text-slate-200 truncate">{tag.tag}</span>
      <span className="text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
        {tag.highCount}/{highCount} ({pct.toFixed(0)}%)
      </span>
    </li>
  );
}

function RangeCard({
  title,
  range,
  avg,
  compare,
}: {
  title: string;
  range: string;
  avg: string;
  compare?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{title}</div>
      <div className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{range}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {avg}
        {compare && <span className="ml-2 text-slate-400">· {compare}</span>}
      </div>
    </div>
  );
}
