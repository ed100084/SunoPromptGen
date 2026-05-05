export interface Section {
  tag: string;
  desc: string;
  lyrics: string;
}

export interface Scenario {
  desc: string;
  language: string;
  genre: string;
  moods: string[];
  instruments: string[];
  vocals: string[];
  textures: string[];
  energy: string;
  bpm: string;
  key: string;
  structure: string;
  negatives: string[];
  extra: string;
}

export interface LanguageInfo {
  suno: string;
  llm: string;
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  defaultModel: string;
  type: 'openai' | 'anthropic' | 'gemini';
}

export type AiMode = 'export' | 'api' | 'template';

export interface SongState {
  songTitle: string;
  language: string;
  genre: string;
  moods: string[];
  energy: string;
  instruments: string[];
  vocals: string[];
  textures: string[];
  negatives: string[];
  bpm: string;
  musicKey: string;
  extra: string;
  cohesion: boolean;
  voiceCloneActive: boolean;
  structureName: string;
  sections: Section[];
  lyricsTheme: string;
  lyricsKeywords: string;
  lyricsStory: string;
}

/**
 * Suno 生成結果回填資料。讓使用者標記哪個 prompt 真的產出好聽的音樂，
 * 累積成自己的「成功配方 dataset」。所有欄位選填。
 */
export interface SongResult {
  /** 1-5 星評分。 */
  rating?: 1 | 2 | 3 | 4 | 5;
  /** Suno 生成的音檔 URL（或任何外部連結）。 */
  audioUrl?: string;
  /** 自由筆記。 */
  notes?: string;
  /** 評分時間（epoch ms）。 */
  ratedAt?: number;
}

export interface HistoryEntry {
  id: string;
  savedAt: number;
  title: string;
  state: SongState;
  stylePrompt: string;
  lyricsPrompt: string;
  /** 使用者回填的 Suno 生成結果（選填）。 */
  result?: SongResult;
}
