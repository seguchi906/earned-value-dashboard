import type { StoredData, RawProject, RawProgressProject, RawOutsourcingRecord } from "./types";

const DEFAULT_DATA: StoredData = {
  projects: [],
  progressProjects: [],
  outsourcingRecords: [],
  projectsLoadedAt: null,
  progressLoadedAt: null,
  outsourcingLoadedAt: null,
  projectsFileTitle: null,
};

const DB_NAME = "earned-value-dashboard";
const DB_VERSION = 1;
const STORE_NAME = "app";
const DATA_KEY = "stored-data";
const STORAGE_TIMEOUT_MS = 2500;

function normalizeData(data: Partial<StoredData> | null | undefined): StoredData {
  return { ...DEFAULT_DATA, ...(data ?? {}) };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDBを開けませんでした。"));
  });
}

async function readFromIndexedDb(): Promise<StoredData | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(DATA_KEY);
    request.onsuccess = () => resolve(request.result ? normalizeData(request.result as Partial<StoredData>) : null);
    request.onerror = () => reject(request.error ?? new Error("保存データの読み込みに失敗しました。"));
    tx.oncomplete = () => db.close();
  });
}

async function writeToIndexedDb(data: StoredData): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(data, DATA_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("保存データの書き込みに失敗しました。"));
    };
  });
}

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(fallback), STORAGE_TIMEOUT_MS);
    promise
      .then((value) => resolve(value))
      .catch((error) => {
        console.error(error);
        resolve(fallback);
      })
      .finally(() => window.clearTimeout(timer));
  });
}

export async function loadFromServer(): Promise<StoredData> {
  if (typeof window === "undefined") return DEFAULT_DATA;

  const indexedDbData = await withTimeout(readFromIndexedDb(), null);
  return indexedDbData ?? DEFAULT_DATA;
}

export async function saveToServer(data: StoredData): Promise<void> {
  if (typeof window === "undefined") return;

  await withTimeout(writeToIndexedDb(data), undefined);
}

export async function updateProjects(
  current: StoredData,
  projects: RawProject[],
  title: string | null
): Promise<StoredData> {
  const next: StoredData = {
    ...current,
    projects,
    projectsLoadedAt: new Date().toISOString(),
    projectsFileTitle: title,
  };
  await saveToServer(next);
  return next;
}

export async function updateProgress(
  current: StoredData,
  progressProjects: RawProgressProject[]
): Promise<StoredData> {
  const next: StoredData = {
    ...current,
    progressProjects,
    progressLoadedAt: new Date().toISOString(),
  };
  await saveToServer(next);
  return next;
}

export async function updateOutsourcing(
  current: StoredData,
  outsourcingRecords: RawOutsourcingRecord[]
): Promise<StoredData> {
  const next: StoredData = {
    ...current,
    outsourcingRecords,
    outsourcingLoadedAt: new Date().toISOString(),
  };
  await saveToServer(next);
  return next;
}

export async function clearServerData(): Promise<StoredData> {
  await saveToServer(DEFAULT_DATA);
  return DEFAULT_DATA;
}
