import { useState } from 'react';
import type { HistoryEntry } from '../types';
import { clearAll, deleteEntry, exportAll, importAll, loadHistory } from '../lib/history';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoad: (entry: HistoryEntry) => void;
  /** 觸發開啟對比視圖。傳入兩筆 entries（A 為基準、B 為對比）。 */
  onCompare: (a: HistoryEntry, b: HistoryEntry) => void;
  refreshKey: number;
}

export function HistoryDrawer({ open, onClose, onLoad, onCompare, refreshKey }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory());
  const [compareMode, setCompareMode] = useState(false);
  /** 對比模式下被選取的 entry id（順序代表 A=index 0, B=index 1）。 */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 重新讀取（外部觸發 refresh 時）
  if (refreshKey !== undefined) {
    // noop - just to depend on refreshKey
  }

  const handleDelete = (id: string) => {
    if (!confirm('確定刪除這筆紀錄？')) return;
    deleteEntry(id);
    setEntries(loadHistory());
    setSelectedIds((s) => s.filter((x) => x !== id));
  };

  const handleClear = () => {
    if (!confirm('確定清空所有歷史紀錄？此操作不可復原。')) return;
    clearAll();
    setEntries([]);
    setSelectedIds([]);
  };

  const handleExport = () => {
    const json = exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suno-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const n = importAll(text);
      setEntries(loadHistory());
      alert(`已匯入 ${n} 筆紀錄`);
    } catch (err) {
      alert(`匯入失敗：${(err as Error).message}`);
    }
    e.target.value = '';
  };

  const toggleCompareMode = () => {
    setCompareMode((m) => !m);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= 2) return [s[1], id]; // FIFO，保留最新兩個
      return [...s, id];
    });
  };

  const handleStartCompare = () => {
    if (selectedIds.length !== 2) return;
    const a = entries.find((e) => e.id === selectedIds[0]);
    const b = entries.find((e) => e.id === selectedIds[1]);
    if (a && b) onCompare(a, b);
  };

  // refresh from props
  if (open && entries.length === 0 && loadHistory().length > 0) {
    setEntries(loadHistory());
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">📜 歷史紀錄</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl"
            aria-label="關閉"
          >
            ✕
          </button>
        </header>

        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 text-xs">
          <button
            onClick={toggleCompareMode}
            className={`px-3 py-1 rounded-md ${
              compareMode
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            🔍 對比模式{compareMode ? ' (開啟)' : ''}
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            ⬇ 匯出 JSON
          </button>
          <label className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
            ⬆ 匯入 JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={handleClear}
            className="px-3 py-1 rounded-md bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/50"
          >
            🗑️ 清空全部
          </button>
        </div>

        {compareMode && (
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-indigo-50/60 dark:bg-indigo-950/30">
            <div className="text-xs text-slate-700 dark:text-slate-200 mb-2">
              選擇 2 筆紀錄進行對比（已選 {selectedIds.length}/2）
            </div>
            <button
              onClick={handleStartCompare}
              disabled={selectedIds.length !== 2}
              className={`w-full py-1.5 rounded text-xs font-medium ${
                selectedIds.length === 2
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              開始對比
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {entries.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-12">尚無紀錄</div>
          ) : (
            <ul className="space-y-2">
              {entries.map((e) => {
                const selectedIdx = selectedIds.indexOf(e.id);
                const isSelected = selectedIdx >= 0;
                return (
                  <li
                    key={e.id}
                    className={`border rounded-lg p-3 transition ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate flex-1">
                        {compareMode && isSelected && (
                          <span className="inline-block px-1.5 py-0.5 mr-1.5 bg-indigo-600 text-white text-[10px] rounded font-bold">
                            {selectedIdx === 0 ? 'A' : 'B'}
                          </span>
                        )}
                        {e.title}
                      </div>
                      {!compareMode && (
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="text-xs text-rose-500 hover:text-rose-700"
                          aria-label="刪除"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      {new Date(e.savedAt).toLocaleString('zh-TW')}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mb-2 line-clamp-2 font-mono">
                      {e.stylePrompt.slice(0, 120)}...
                    </div>
                    {compareMode ? (
                      <button
                        onClick={() => toggleSelect(e.id)}
                        className={`w-full py-1.5 text-xs rounded ${
                          isSelected
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {isSelected ? `✓ 已選為 ${selectedIdx === 0 ? 'A' : 'B'}` : '選取對比'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onLoad(e);
                          onClose();
                        }}
                        className="w-full py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        ↩ 載入此紀錄
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
