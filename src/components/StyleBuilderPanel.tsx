import {
  ENERGY,
  GENRES,
  INSTRUMENTS,
  LANGUAGES,
  MOODS,
  NEGATIVES,
  SCENARIOS,
  TEXTURES,
  VOCALS,
  COHESION_KEYWORDS,
} from '../data';
import type { SongState } from '../types';
import { Section as SectionBlock } from './Section';
import { SingleSelect } from './SingleSelect';
import { MultiSelectChips } from './MultiSelectChips';

interface Props {
  state: SongState;
  scenario: string;
  onApplyScenario: (name: string) => void;
  onUpdate: <K extends keyof SongState>(key: K, value: SongState[K]) => void;
}

/**
 * 左欄上半：情境範本 + Layer 1-4（曲風 / 情緒 / 樂器 / 人聲 / 紋理 / Negative / 連貫性 / 額外）。
 */
export function StyleBuilderPanel({ state, scenario, onApplyScenario, onUpdate }: Props) {
  return (
    <>
      <SectionBlock title="🎯 一鍵情境範本" hint="選擇後自動填入所有欄位，再依需要微調">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(SCENARIOS).map(([name, info]) => (
            <button
              key={name}
              type="button"
              onClick={() => onApplyScenario(name)}
              className={`text-left p-3 rounded-lg border transition ${
                scenario === name
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'
              }`}
            >
              <div className="font-medium text-sm text-slate-800 dark:text-slate-100">{name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {info.desc}
              </div>
            </button>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="🎼 Layer 1：基本骨架"
        hint="v5.5 第一層：tempo + key + 曲風 + 能量強度 + 語言"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
              歌曲標題（選填）
            </label>
            <input
              type="text"
              value={state.songTitle}
              onChange={(e) => onUpdate('songTitle', e.target.value)}
              placeholder="例：心之所向"
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">🌐 語言 / 語系</label>
            <SingleSelect options={LANGUAGES} value={state.language} onChange={(v) => onUpdate('language', v)} />
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">曲風</label>
            <SingleSelect options={GENRES} value={state.genre} onChange={(v) => onUpdate('genre', v)} />
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">能量強度</label>
            <SingleSelect options={ENERGY} value={state.energy} onChange={(v) => onUpdate('energy', v)} />
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">BPM</label>
            <input
              type="number"
              value={state.bpm}
              onChange={(e) => onUpdate('bpm', e.target.value)}
              min={40}
              max={200}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">調性 Key</label>
            <input
              type="text"
              value={state.musicKey}
              onChange={(e) => onUpdate('musicKey', e.target.value)}
              placeholder="C major / Am"
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
        {state.language === '純樂器(無歌詞)' && (
          <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
            ⚠️ 純樂器模式：人聲將被略過，歌詞段落清空
          </div>
        )}
      </SectionBlock>

      <SectionBlock title="😌 情緒（建議 1-2 個）">
        <MultiSelectChips
          options={MOODS}
          selected={state.moods}
          onChange={(v) => onUpdate('moods', v)}
          color="rose"
        />
      </SectionBlock>

      <SectionBlock
        title="🎸 Layer 2：樂器配置（建議 2-4 項）"
        hint="v5.5 對「形容詞+樂器」反應比裸樂器名更精準"
      >
        <MultiSelectChips
          options={INSTRUMENTS}
          selected={state.instruments}
          onChange={(v) => onUpdate('instruments', v)}
          color="emerald"
        />
      </SectionBlock>

      <SectionBlock
        title="🎤 Layer 3：人聲方向"
        hint="若使用 Voice Clone 建議勾選下方略過人聲描述"
      >
        <label className="flex items-center gap-2 mb-3 cursor-pointer select-none text-sm">
          <input
            type="checkbox"
            checked={state.voiceCloneActive}
            onChange={(e) => onUpdate('voiceCloneActive', e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          <span
            className={
              state.voiceCloneActive
                ? 'text-indigo-700 dark:text-indigo-300 font-medium'
                : 'text-slate-600 dark:text-slate-300'
            }
          >
            我已啟用 Voice Clone（自動略過人聲描述）
          </span>
        </label>
        {!state.voiceCloneActive && (
          <MultiSelectChips
            options={VOCALS}
            selected={state.vocals}
            onChange={(v) => onUpdate('vocals', v)}
            color="indigo"
          />
        )}
        {state.voiceCloneActive && (
          <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            Voice Clone 模式：人聲描述已略過，避免衝突
          </div>
        )}
      </SectionBlock>

      <SectionBlock
        title="🎚️ Layer 4：製作風格 / 紋理（建議 2-3 項）"
        hint="v5.5 對細節描述（板式殘響、貼耳收音等）反應極佳"
      >
        <MultiSelectChips
          options={TEXTURES}
          selected={state.textures}
          onChange={(v) => onUpdate('textures', v)}
          color="amber"
        />
      </SectionBlock>

      <SectionBlock
        title="🚫 Negative Prompts（v5.5 必用！建議 2-3 個）"
        hint="明確告訴模型不要什麼，比正向描述更能聚焦結果"
      >
        <MultiSelectChips
          options={NEGATIVES}
          selected={state.negatives}
          onChange={(v) => onUpdate('negatives', v)}
          color="red"
        />
      </SectionBlock>

      <SectionBlock title="✨ 抗切割感" hint="自動加入 seamless transitions 等關鍵字">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.cohesion}
            onChange={(e) => onUpdate('cohesion', e.target.checked)}
            className="w-5 h-5 accent-indigo-600"
          />
          <span className="text-sm text-slate-700 dark:text-slate-200">啟用連貫性關鍵字（建議開啟）</span>
        </label>
        {state.cohesion && (
          <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded text-xs text-indigo-800 dark:text-indigo-300 font-mono break-all">
            + {COHESION_KEYWORDS}
          </div>
        )}
      </SectionBlock>

      <SectionBlock title="➕ 額外補充關鍵字">
        <textarea
          value={state.extra}
          onChange={(e) => onUpdate('extra', e.target.value)}
          rows={2}
          placeholder="例：90s style, retro synth"
          className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none text-sm"
        />
      </SectionBlock>
    </>
  );
}
