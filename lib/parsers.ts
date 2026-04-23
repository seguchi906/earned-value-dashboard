import type {
  ProjectsFile,
  RawProject,
  RawProgressProject,
  RawOutsourcingRecord,
} from "./types";

// ===== 全体工程表 JSON パーサー =====

export interface ParseProjectsResult {
  projects: RawProject[];
  title: string | null;
  updatedAt: string | null;
  error?: string;
}

export function parseProjectsJson(text: string): ParseProjectsResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { projects: [], title: null, updatedAt: null, error: "JSONの解析に失敗しました。" };
  }

  // ProjectsFile 形式（{ projects: [...] }）
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    "projects" in parsed &&
    Array.isArray((parsed as Record<string, unknown>).projects)
  ) {
    const file = parsed as ProjectsFile;
    return {
      projects: file.projects,
      title: file.title ?? null,
      updatedAt: file.updatedAt ?? null,
    };
  }

  // 配列形式（projects の配列そのまま）
  if (Array.isArray(parsed)) {
    return { projects: parsed as RawProject[], title: null, updatedAt: null };
  }

  return {
    projects: [],
    title: null,
    updatedAt: null,
    error: "期待されるJSON形式（{ projects: [...] }）ではありません。",
  };
}

// ===== 進捗ダッシュボード JSON パーサー =====

export interface ParseProgressResult {
  projects: RawProgressProject[];
  error?: string;
}

export function parseProgressJson(text: string): ParseProgressResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { projects: [], error: "JSONの解析に失敗しました。" };
  }

  if (!Array.isArray(parsed)) {
    return {
      projects: [],
      error: "期待されるJSON形式（配列）ではありません。",
    };
  }

  // wp → weeklyProgress の正規化
  const normalized = (parsed as RawProgressProject[]).map((p) => ({
    ...p,
    id: p.id ?? p.number ?? "",
    number: p.number ?? p.id ?? "",
    weeklyProgress:
      p.weeklyProgress ??
      (p.wp ? [...p.wp] : Array<null>(51).fill(null)),
  }));

  return { projects: normalized };
}

// ===== 外注管理 CSV パーサー =====

export interface ParseOutsourcingResult {
  records: RawOutsourcingRecord[];
  error?: string;
}

/**
 * BOM付きCSVをパースしてRawOutsourcingRecord[]を返す。
 * 列構成（19列）:
 *   0:会社名, 1:業務番号, 2:電話番号, 3:担当者, 4:業務名
 *   5:委託金額(税抜)【当初】, 6:外注工期(開始)【当初】, 7:外注工期(終了)【当初】, 8:外注申請日【当初】
 *   9:委託金額(税抜)【第1回変更】, 10:外注工期(開始)【第1回変更】, 11:外注工期(終了)【第1回変更】, 12:外注申請日【第1回変更】
 *   13:委託金額(税抜)【第2回変更】, 14:外注工期(開始)【第2回変更】, 15:外注工期(終了)【第2回変更】, 16:外注申請日【第2回変更】
 *   17:受取日, 18:管理部への連絡
 * 最新バージョン: 第2回変更 → 第1回変更 → 当初 の順に金額が非空のものを採用
 */
export function parseOutsourcingCsv(text: string): ParseOutsourcingResult {
  // BOM除去
  const clean = text.startsWith("\uFEFF") ? text.slice(1) : text;

  // 簡易CSVパーサー（ダブルクォート内のカンマ・改行対応）
  function parseCsvRows(src: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (inQuotes) {
        if (ch === '"') {
          if (src[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else {
          field += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          row.push(field); field = "";
        } else if (ch === '\n') {
          row.push(field); field = "";
          rows.push(row); row = [];
        } else if (ch === '\r') {
          // skip CR
        } else {
          field += ch;
        }
      }
    }
    if (field || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
  }

  function toIsoDate(val: string): string | null {
    const trimmed = val.trim();
    // YYYY.MM.DD → YYYY-MM-DD
    const match = trimmed.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
    if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
    // YYYY-MM-DD はそのまま
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    return null;
  }

  function toAmount(val: string): number {
    const n = Number(val.trim().replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
  }

  try {
    const rows = parseCsvRows(clean);
    // ヘッダー行をスキップ（1行目）
    const dataRows = rows.slice(1).filter((r) => r.length >= 6 && r[1]?.trim());

    const records: RawOutsourcingRecord[] = dataRows.map((cols) => {
      const company = (cols[0] ?? "").trim();
      const jobNo = (cols[1] ?? "").trim();
      const workName = (cols[4] ?? "").trim();

      // 最新バージョン判定: 第2回変更(13,14) → 第1回変更(9,10) → 当初(5,6)
      let latestAmount = 0;
      let latestStartDate: string | null = null;

      const v2Amount = (cols[13] ?? "").trim();
      const v1Amount = (cols[9] ?? "").trim();
      const v0Amount = (cols[5] ?? "").trim();

      if (v2Amount !== "") {
        latestAmount = toAmount(v2Amount);
        latestStartDate = toIsoDate(cols[14] ?? "");
      } else if (v1Amount !== "") {
        latestAmount = toAmount(v1Amount);
        latestStartDate = toIsoDate(cols[10] ?? "");
      } else {
        latestAmount = toAmount(v0Amount);
        latestStartDate = toIsoDate(cols[6] ?? "");
      }

      return { jobNo, workName, company, latestAmount, latestStartDate };
    });

    return { records };
  } catch (e) {
    return { records: [], error: `CSVの解析に失敗しました: ${String(e)}` };
  }
}
