import {
  createPersistedProjectEnvelope,
  decodePersistedProjectEnvelope,
  isLegacyHistoryEntry,
  migrateLegacyHistoryEntry,
  type PersistedProjectEnvelope,
  type SongProject,
} from '../domain';

const DATABASE_NAME = 'suno-prompt-gen';
const DATABASE_VERSION = 1;
const PROJECT_STORE = 'projects';
export const PROJECTS_KEY = 'suno_projects_v2';
export const LEGACY_HISTORY_KEY = 'suno_history_v1';

interface ProjectStorage {
  list(): Promise<unknown[]>;
  put(envelope: PersistedProjectEnvelope): Promise<void>;
  replace(envelopes: PersistedProjectEnvelope[]): Promise<void>;
  delete(id: string): Promise<void>;
}

function getLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readLocalJson(key: string): unknown {
  try {
    const raw = getLocalStorage()?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function validEnvelopes(values: unknown[]): PersistedProjectEnvelope[] {
  return values.flatMap((value) => {
    const decoded = decodePersistedProjectEnvelope(value);
    return decoded.ok ? [decoded.value] : [];
  });
}

class LocalStorageProjectStorage implements ProjectStorage {
  async list(): Promise<unknown[]> {
    const stored = readLocalJson(PROJECTS_KEY);
    return Array.isArray(stored) ? stored : [];
  }

  async put(envelope: PersistedProjectEnvelope): Promise<void> {
    const current = validEnvelopes(await this.list());
    const next = [envelope, ...current.filter((item) => item.project.id !== envelope.project.id)];
    this.write(next);
  }

  async replace(envelopes: PersistedProjectEnvelope[]): Promise<void> {
    this.write(envelopes);
  }

  async delete(id: string): Promise<void> {
    const current = validEnvelopes(await this.list());
    this.write(current.filter((item) => item.project.id !== id));
  }

  private write(envelopes: PersistedProjectEnvelope[]): void {
    const storage = getLocalStorage();
    if (!storage) throw new Error('localStorage is unavailable');
    storage.setItem(PROJECTS_KEY, JSON.stringify(envelopes));
  }
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
  });
}

class IndexedDbProjectStorage implements ProjectStorage {
  private databasePromise: Promise<IDBDatabase> | null = null;

  constructor(private readonly factory: IDBFactory) {}

  async list(): Promise<unknown[]> {
    const database = await this.open();
    const transaction = database.transaction(PROJECT_STORE, 'readonly');
    const done = transactionDone(transaction);
    const request = transaction.objectStore(PROJECT_STORE).getAll();
    const result = await requestResult(request);
    await done;
    return result;
  }

  async put(envelope: PersistedProjectEnvelope): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(PROJECT_STORE, 'readwrite');
    transaction.objectStore(PROJECT_STORE).put(envelope);
    await transactionDone(transaction);
  }

  async replace(envelopes: PersistedProjectEnvelope[]): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(PROJECT_STORE, 'readwrite');
    const store = transaction.objectStore(PROJECT_STORE);
    store.clear();
    envelopes.forEach((envelope) => store.put(envelope));
    await transactionDone(transaction);
  }

  async delete(id: string): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(PROJECT_STORE, 'readwrite');
    transaction.objectStore(PROJECT_STORE).delete(id);
    await transactionDone(transaction);
  }

  private open(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise;
    this.databasePromise = new Promise((resolve, reject) => {
      const request = this.factory.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(PROJECT_STORE)) {
          database.createObjectStore(PROJECT_STORE, { keyPath: 'project.id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB'));
      request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked'));
    });
    return this.databasePromise;
  }
}

export interface ProjectRepository {
  list(): Promise<SongProject[]>;
  save(project: SongProject): Promise<void>;
  saveAll(projects: SongProject[]): Promise<void>;
  delete(id: string): Promise<void>;
  import(json: string): Promise<SongProject[]>;
  export(projects?: SongProject[]): Promise<string>;
}

export interface ProjectRepositoryOptions {
  indexedDB?: IDBFactory | null;
}

export function createProjectRepository(options: ProjectRepositoryOptions = {}): ProjectRepository {
  const local = new LocalStorageProjectStorage();
  const indexedDbFactory = options.indexedDB === undefined
    ? (typeof indexedDB === 'undefined' ? null : indexedDB)
    : options.indexedDB;
  const primary = indexedDbFactory ? new IndexedDbProjectStorage(indexedDbFactory) : null;
  let indexedDbFailed = false;

  const withStorage = async <T>(operation: (storage: ProjectStorage) => Promise<T>): Promise<T> => {
    if (primary && !indexedDbFailed) {
      try {
        return await operation(primary);
      } catch (error) {
        indexedDbFailed = true;
        console.warn('[projects] IndexedDB unavailable; using localStorage:', error);
      }
    }
    return operation(local);
  };

  const listEnvelopes = async (): Promise<PersistedProjectEnvelope[]> => {
    const stored = validEnvelopes(await withStorage((storage) => storage.list()));
    if (stored.length > 0) return stored;

    // Preserve both the previous v6 localStorage repository and pre-v6 history.
    const localProjects = readLocalJson(PROJECTS_KEY);
    const previous = Array.isArray(localProjects) ? validEnvelopes(localProjects) : [];
    const legacy = readLocalJson(LEGACY_HISTORY_KEY);
    const migrated = Array.isArray(legacy)
      ? legacy.filter(isLegacyHistoryEntry).map(migrateLegacyHistoryEntry)
      : [];
    const initial = previous.length > 0 ? previous : migrated;
    if (initial.length > 0) await withStorage((storage) => storage.replace(initial));
    return initial;
  };

  return {
    async list() {
      const envelopes = await listEnvelopes();
      return envelopes
        .sort((left, right) => right.project.updatedAt - left.project.updatedAt)
        .map((envelope) => envelope.project);
    },

    async save(project) {
      const envelope = createPersistedProjectEnvelope(project);
      const decoded = decodePersistedProjectEnvelope(envelope);
      if (!decoded.ok) throw new Error(decoded.errors.join('; '));
      await withStorage((storage) => storage.put(decoded.value));
    },

    async saveAll(projects) {
      const envelopes = projects.map((project) => createPersistedProjectEnvelope(project));
      const decoded = envelopes.map((envelope) => decodePersistedProjectEnvelope(envelope));
      const invalid = decoded.find((result) => !result.ok);
      if (invalid && !invalid.ok) throw new Error(invalid.errors.join('; '));
      await withStorage((storage) => storage.replace(envelopes));
    },

    async delete(id) {
      await withStorage((storage) => storage.delete(id));
    },

    async import(json) {
      let data: unknown;
      try {
        data = JSON.parse(json);
      } catch (error) {
        throw new Error(`Invalid project JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
      const values = Array.isArray(data) ? data : [data];
      const decoded = values.map((value) => decodePersistedProjectEnvelope(value));
      const invalid = decoded.find((result) => !result.ok);
      if (invalid && !invalid.ok) throw new Error(invalid.errors.join('; '));
      const imported = decoded.flatMap((result) => result.ok ? [result.value] : []);
      const current = await listEnvelopes();
      const importedIds = new Set(imported.map((envelope) => envelope.project.id));
      const merged = [
        ...imported,
        ...current.filter((envelope) => !importedIds.has(envelope.project.id)),
      ];
      await withStorage((storage) => storage.replace(merged));
      return merged
        .sort((left, right) => right.project.updatedAt - left.project.updatedAt)
        .map((envelope) => envelope.project);
    },

    async export(projects) {
      const values = projects ?? await this.list();
      return JSON.stringify(values.map((project) => createPersistedProjectEnvelope(project)), null, 2);
    },
  };
}

const defaultRepository = createProjectRepository();

export const listProjects = (): Promise<SongProject[]> => defaultRepository.list();
export const loadProjects = listProjects;
export const saveProject = (project: SongProject): Promise<void> => defaultRepository.save(project);
export const saveProjects = (projects: SongProject[]): Promise<void> => defaultRepository.saveAll(projects);
export const deleteProject = (id: string): Promise<void> => defaultRepository.delete(id);
export const importProjects = (json: string): Promise<SongProject[]> => defaultRepository.import(json);
export const exportProjects = (projects?: SongProject[]): Promise<string> => defaultRepository.export(projects);
