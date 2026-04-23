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

// ===== サーバー側API経由の読み書き =====

/** サーバーからデータを取得する */
export async function loadFromServer(): Promise<StoredData> {
  try {
    const res = await fetch("/api/data", { cache: "no-store" });
    if (!res.ok) return DEFAULT_DATA;
    const parsed = await res.json() as Partial<StoredData>;
    return { ...DEFAULT_DATA, ...parsed };
  } catch {
    return DEFAULT_DATA;
  }
}

/** サーバーにデータを保存する */
export async function saveToServer(data: StoredData): Promise<void> {
  try {
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    console.error("サーバーへのデータ保存に失敗しました。");
  }
}

// ===== データ更新ヘルパー =====

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
