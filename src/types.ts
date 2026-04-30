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

export interface HistoryEntry {
  id: string;
  savedAt: number;
  title: string;
  state: SongState;
  stylePrompt: string;
  lyricsPrompt: string;
}
