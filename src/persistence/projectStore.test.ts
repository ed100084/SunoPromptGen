import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSongProject, createPersistedProjectEnvelope } from '../domain';
import type { HistoryEntry, SongState } from '../types';
import {
  LEGACY_HISTORY_KEY,
  PROJECTS_KEY,
  createProjectRepository,
} from './projectStore';

const state: SongState = {
  songTitle: 'Legacy song', language: '華語(繁體)', genre: '華語流行', moods: ['希望'],
  energy: '中（穩定流動）', instruments: ['暖音鋼琴'], vocals: ['女聲(柔/氣音)'],
  textures: [], negatives: [], bpm: '92', musicKey: 'A major', extra: '', cohesion: true,
  voiceCloneActive: false, structureName: '', sections: [], lyricsTheme: '重新出發',
  lyricsKeywords: '', lyricsStory: '',
};

function localRepository() {
  return createProjectRepository({ indexedDB: null });
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('projectStore localStorage fallback', () => {
  it('支援 list/save/delete，並儲存版本化 envelope', async () => {
    const repository = localRepository();
    const project = createDefaultSongProject({ id: 'p1', revisionId: 'r1', now: 10 });

    await repository.save(project);
    expect(await repository.list()).toEqual([project]);
    expect(localStorage.getItem(PROJECTS_KEY)).toContain('suno-prompt-gen/project');

    await repository.delete(project.id);
    expect(await repository.list()).toEqual([]);
  });

  it('saveAll 以目前 project 集合取代既有資料', async () => {
    const repository = localRepository();
    const first = createDefaultSongProject({ id: 'p1', revisionId: 'r1', now: 10 });
    const second = createDefaultSongProject({ id: 'p2', revisionId: 'r2', now: 20 });

    await repository.saveAll([first, second]);
    await repository.saveAll([second]);

    expect(await repository.list()).toEqual([second]);
  });

  it('首次載入時遷移 legacy history 並保留原資料', async () => {
    const legacy: HistoryEntry = {
      id: 'old', savedAt: 10, title: 'Legacy song', state,
      stylePrompt: 'old style', lyricsPrompt: 'old lyrics', sunoVersion: 'v5.5',
    };
    localStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([legacy]));

    const projects = await localRepository().list();

    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('old');
    expect(projects[0].revisions[0].renderedPrompt?.style).toBe('old style');
    expect(localStorage.getItem(PROJECTS_KEY)).toContain('suno-prompt-gen/project');
    expect(localStorage.getItem(LEGACY_HISTORY_KEY)).toContain('Legacy song');
  });

  it('import/export 接受單一或陣列 envelope 並執行 runtime validation', async () => {
    const repository = localRepository();
    const project = createDefaultSongProject({ id: 'p1', revisionId: 'r1', now: 10 });
    const envelope = createPersistedProjectEnvelope(project, 20);

    expect(await repository.import(JSON.stringify(envelope))).toEqual([project]);
    const exported = await repository.export();
    expect(exported).toContain('"schemaVersion": 1');
    expect(exported).toContain('"kind": "suno-prompt-gen/project"');

    await expect(repository.import(JSON.stringify([{ ...envelope, schemaVersion: 999 }]))).rejects
      .toThrow('Unsupported persisted project schemaVersion');
    expect(await repository.list()).toEqual([project]);
  });
});

describe('projectStore backend selection', () => {
  it('IndexedDB 無法開啟時退回 localStorage', async () => {
    const project = createDefaultSongProject({ id: 'fallback', revisionId: 'r1', now: 10 });
    const brokenIndexedDb = {
      open() {
        const request: Record<string, unknown> = {};
        queueMicrotask(() => {
          request.error = new Error('blocked');
          (request.onerror as (() => void) | undefined)?.();
        });
        return request;
      },
    } as unknown as IDBFactory;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const repository = createProjectRepository({ indexedDB: brokenIndexedDb });

    await repository.save(project);

    expect(await repository.list()).toEqual([project]);
    expect(localStorage.getItem(PROJECTS_KEY)).toContain('fallback');
    expect(warn).toHaveBeenCalledWith(
      '[projects] IndexedDB unavailable; using localStorage:',
      expect.any(Error),
    );
  });

  it('IndexedDB 可用時優先使用，不寫入 localStorage', async () => {
    const records = new Map<string, unknown>();
    const objectStore = {
      getAll() {
        return successfulRequest([...records.values()]);
      },
      put(value: { project: { id: string } }) {
        records.set(value.project.id, value);
        return successfulRequest(undefined);
      },
      clear() {
        records.clear();
        return successfulRequest(undefined);
      },
      delete(id: string) {
        records.delete(id);
        return successfulRequest(undefined);
      },
    };
    const database = {
      objectStoreNames: { contains: () => true },
      transaction() {
        return successfulTransaction(objectStore);
      },
    };
    const indexedDb = {
      open() {
        return successfulRequest(database);
      },
    } as unknown as IDBFactory;
    const repository = createProjectRepository({ indexedDB: indexedDb });
    const project = createDefaultSongProject({ id: 'idb', revisionId: 'r1', now: 10 });

    await repository.save(project);

    expect(await repository.list()).toEqual([project]);
    expect(localStorage.getItem(PROJECTS_KEY)).toBeNull();
  });
});

function successfulRequest<T>(result: T): IDBRequest<T> {
  const request: Record<string, unknown> = { result, error: null };
  queueMicrotask(() => (request.onsuccess as (() => void) | undefined)?.());
  return request as unknown as IDBRequest<T>;
}

function successfulTransaction(objectStore: object): IDBTransaction {
  const transaction: Record<string, unknown> = {
    error: null,
    objectStore: () => objectStore,
  };
  queueMicrotask(() => (transaction.oncomplete as (() => void) | undefined)?.());
  return transaction as unknown as IDBTransaction;
}
