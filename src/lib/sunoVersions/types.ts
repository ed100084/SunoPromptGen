/**
 * Suno 版本抽象層 — 介面定義。
 *
 * 不同 Suno 版本在 prompt 結構、字數限制、標籤策略上有差異。
 * 將版本相關的所有資料和邏輯收斂到 SunoVersion 介面，未來新增 v6 / v7
 * 時只需新建檔案實作此介面，不需動其他程式碼。
 */

import type { LanguageInfo, SongState } from '../../types';

export interface StyleLayer {
  /** 在 UI 顯示的標籤，例如 'Layer 1', '✨ 連貫性', '🚫 Negatives'。 */
  label: string;
  /** 簡短說明，例如「基本骨架」。 */
  hint?: string;
  /** 這層產生的 tag 列表（已查表為英文）。 */
  tags: string[];
}

export interface SunoVersionConstraints {
  /** Style prompt 字元上限（用於 UI 警示）。 */
  maxStyleLength: number;
  /** 建議 tag 數量範圍 [min, max]。 */
  recommendedTagRange: [number, number];
  /** tag 數超過此值轉黃色警示。 */
  tagWarnThreshold: number;
}

export interface SunoVersion {
  /** 版本識別碼，例如 'v5.5'、'v6'。 */
  id: string;
  /** UI 顯示名稱。 */
  label: string;

  // ─── 詞彙映射（中文鍵 → Suno 英文 tag） ───
  GENRES: Record<string, string>;
  MOODS: Record<string, string>;
  ENERGY: Record<string, string>;
  INSTRUMENTS: Record<string, string>;
  VOCALS: Record<string, string>;
  TEXTURES: Record<string, string>;
  NEGATIVES: Record<string, string>;
  LANGUAGES: Record<string, LanguageInfo>;

  /** 連貫性關鍵字（v5.5 抗切割感技巧；不同版本可能不同 / 不需要）。 */
  COHESION_KEYWORDS: string;

  /** UI 約束（字數、tag 數）。 */
  constraints: SunoVersionConstraints;

  /**
   * 把 SongState 組成 style prompt（純函數）。
   * v5.5 為四層架構（tempo+key → 樂器 → 人聲 → 紋理），
   * 未來版本可能改為其他結構。
   */
  buildStylePrompt: (state: SongState) => string;

  /**
   * 把 style prompt 拆解成各層級資訊（用於 UI 視覺化教學）。
   * 順序代表畫面顯示順序；若該層為空可省略。
   */
  buildStyleLayers: (state: SongState) => StyleLayer[];

  /** 心法提示，顯示於 UI 右下角。 */
  promptTips: string[];
}
