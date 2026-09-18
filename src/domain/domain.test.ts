import { describe, expect, it } from 'vitest';
import type { HistoryEntry, SongState } from '../types';
import {
  CANONICAL_DOMAIN_VERSION,
  PERSISTED_PROJECT_SCHEMA_VERSION,
  createDefaultSongProject,
  createPersistedProjectEnvelope,
  decodePersistedProjectEnvelope,
  isLegacyHistoryEntry,
  isLegacySongState,
  isSongProject,
  isVocalIntent,
  migrateLegacyHistoryEntry,
  migrateLegacySongState,
  parsePersistedProjectEnvelope,
} from './index';

const legacyState: SongState = {
  songTitle: '午夜列車',
  language: '華語(繁體)',
  genre: '華語抒情',
  moods: ['懷舊', '希望'],
  energy: '中等',
  instruments: ['鋼琴', '弦樂'],
  vocals: ['女聲(柔/氣音)'],
  textures: ['溫暖類比'],
  negatives: ['無 Autotune'],
  bpm: '88',
  musicKey: 'C minor',
  extra: '雨夜月台',
  cohesion: true,
  voiceCloneActive: false,
  structureName: '流行敘事',
  sections: [{ tag: 'Verse', desc: '低聲開場', lyrics: '列車慢慢離站' }],
  lyricsTheme: '告別與重逢',
  lyricsKeywords: '月台，車窗, 雨',
  lyricsStory: '主角搭上末班車，決定重新出發。',
};

const legacyEntry: HistoryEntry = {
  id: 'history-1',
  savedAt: 1_735_000_000_000,
  title: '午夜列車',
  sunoVersion: 'v5.5',
  state: legacyState,
  stylePrompt: 'warm piano ballad',
  lyricsPrompt: '[Verse]\n列車慢慢離站',
  result: { rating: 5, notes: '保留作為歷史 metadata', ratedAt: 1_735_000_000_100 },
};

describe('canonical v6 domain defaults', () => {
  it('建立有效且彼此獨立的 project defaults', () => {
    const first = createDefaultSongProject({
      id: 'project-1',
      revisionId: 'revision-1',
      now: 100,
    });
    const second = createDefaultSongProject({
      id: 'project-2',
      revisionId: 'revision-2',
      now: 200,
    });

    first.revisions[0].brief.moods.push('dreamy');

    expect(first.domainVersion).toBe(CANONICAL_DOMAIN_VERSION);
    expect(first.activeRevisionId).toBe('revision-1');
    expect(second.revisions[0].brief.moods).toEqual([]);
    expect(first.revisions[0].generationTarget.model).toBe('v6');
    expect(isSongProject(first)).toBe(true);
  });
});

describe('VocalIntent invariants', () => {
  it('只接受 vocal 設定或完全不含 vocal 欄位的 instrumental', () => {
    expect(isVocalIntent({ mode: 'vocal', descriptors: ['alto'], useVoiceClone: false })).toBe(true);
    expect(isVocalIntent({ mode: 'instrumental' })).toBe(true);
    expect(isVocalIntent({ mode: 'instrumental', descriptors: [], useVoiceClone: false })).toBe(false);
    expect(isVocalIntent({ mode: 'vocal' })).toBe(false);
  });
});

describe('versioned persistence decoder', () => {
  it('round-trips a persisted project envelope', () => {
    const project = createDefaultSongProject({ id: 'p', revisionId: 'r', now: 10 });
    const envelope = createPersistedProjectEnvelope(project, 20);
    const decoded = decodePersistedProjectEnvelope(envelope);

    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.value.schemaVersion).toBe(PERSISTED_PROJECT_SCHEMA_VERSION);
    expect(decoded.value.project).toEqual(project);
    expect(decoded.value.project).not.toBe(project);
  });

  it('拒絕未知 persistence schema 與結構不完整的 project', () => {
    const project = createDefaultSongProject({ id: 'p', revisionId: 'r', now: 10 });
    const unknownSchema = { ...createPersistedProjectEnvelope(project, 20), schemaVersion: 99 };
    expect(decodePersistedProjectEnvelope(unknownSchema)).toEqual({
      ok: false,
      errors: ['Unsupported persisted project schemaVersion: 99'],
    });

    const broken = createPersistedProjectEnvelope(project, 20) as unknown as {
      project: { activeRevisionId: string };
    };
    broken.project.activeRevisionId = 'missing';
    const result = decodePersistedProjectEnvelope(broken);
    expect(result.ok).toBe(false);
  });

  it('安全處理 invalid JSON', () => {
    const result = parsePersistedProjectEnvelope('{bad json');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/^Invalid JSON:/);
  });
});

describe('legacy migration', () => {
  it('辨識 legacy SongState / HistoryEntry', () => {
    expect(isLegacySongState(legacyState)).toBe(true);
    expect(isLegacyHistoryEntry(legacyEntry)).toBe(true);
    expect(isLegacySongState({ ...legacyState, moods: 'sad' })).toBe(false);
  });

  it('將 SongState losslessly 映射到主要 canonical 欄位', () => {
    const project = migrateLegacySongState(legacyState, {
      projectId: 'p',
      revisionId: 'r',
      createdAt: 42,
      sunoVersion: 'v5.5',
      stylePrompt: 'style',
      lyricsPrompt: 'lyrics',
    });
    const revision = project.revisions[0];

    expect(revision.brief).toMatchObject({
      title: '午夜列車',
      language: '華語(繁體)',
      genre: '華語抒情',
      keywords: ['月台', '車窗', '雨'],
      additionalDirection: '雨夜月台',
    });
    expect(revision.arrangement).toMatchObject({
      bpm: 88,
      key: 'C minor',
      instruments: ['鋼琴', '弦樂'],
      sections: [{ tag: 'Verse', description: '低聲開場', lyrics: '列車慢慢離站' }],
    });
    expect(revision.vocalIntent).toEqual({
      mode: 'vocal',
      descriptors: ['女聲(柔/氣音)'],
      useVoiceClone: false,
    });
    expect(revision.constraints.avoid).toEqual(['無 Autotune']);
    expect(revision.generationTarget.model).toBe('v6');
    expect(revision.generationTarget.workflow).toBe('create');
    expect(revision.generationTarget.variant).toBe('migrated-from:v5.5');
    expect(revision.renderedPrompt).toMatchObject({ style: 'style', lyrics: 'lyrics' });
    expect(isSongProject(project)).toBe(true);
  });

  it('將純樂器 legacy state 映射為 instrumental vocal intent', () => {
    const project = migrateLegacySongState({
      ...legacyState,
      language: '純樂器(無歌詞)',
      bpm: 'not-a-number',
    }, { projectId: 'p', revisionId: 'r', createdAt: 1 });

    expect(project.revisions[0].vocalIntent).toEqual({ mode: 'instrumental' });
    expect(project.revisions[0].arrangement.bpm).toBeNull();
  });

  it('將 HistoryEntry 包裝成版本化 persistence envelope', () => {
    const envelope = migrateLegacyHistoryEntry(legacyEntry);

    expect(envelope).toMatchObject({
      kind: 'suno-prompt-gen/project',
      schemaVersion: PERSISTED_PROJECT_SCHEMA_VERSION,
      savedAt: legacyEntry.savedAt,
      project: { id: legacyEntry.id, createdAt: legacyEntry.savedAt },
    });
    expect(decodePersistedProjectEnvelope(envelope).ok).toBe(true);
  });
});
