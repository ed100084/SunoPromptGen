import { useEffect, useState } from 'react';
import type { SongResult } from '../types';

interface Props {
  value: SongResult | undefined;
  onSave: (next: SongResult | null) => void;
  onCancel: () => void;
}

/**
 * 評分編輯表單：星等 + 音檔連結 + 筆記。
 * 用於 HistoryDrawer 內的 inline 編輯。
 */
export function RatingEditor({ value, onSave, onCancel }: Props) {
  const [rating, setRating] = useState<SongResult['rating'] | undefined>(value?.rating);
  const [audioUrl, setAudioUrl] = useState(value?.audioUrl ?? '');
  const [notes, setNotes] = useState(value?.notes ?? '');

  useEffect(() => {
    setRating(value?.rating);
    setAudioUrl(value?.audioUrl ?? '');
    setNotes(value?.notes ?? '');
  }, [value]);

  const handleSave = () => {
    if (!rating && !audioUrl && !notes) {
      onSave(null);
    } else {
      onSave({
        rating,
        audioUrl: audioUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }
  };

  return (
    <div className="space-y-2 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <div>
        <label className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 block">評分</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(rating === n ? undefined : (n as SongResult['rating']))}
              className={`text-2xl transition ${
                rating && n <= rating
                  ? 'text-amber-400 hover:text-amber-500'
                  : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'
              }`}
              aria-label={`${n} 星`}
            >
              ★
            </button>
          ))}
          {rating && (
            <button
              type="button"
              onClick={() => setRating(undefined)}
              className="ml-1 text-xs text-slate-400 hover:text-slate-600"
            >
              清除
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 block">
          Suno 音檔連結（選填）
        </label>
        <input
          type="url"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          placeholder="https://suno.com/song/..."
          className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none font-mono"
        />
      </div>

      <div>
        <label className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 block">
          筆記（選填）
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="這次調整了什麼？哪裡不錯？"
          className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          儲存
        </button>
      </div>
    </div>
  );
}
