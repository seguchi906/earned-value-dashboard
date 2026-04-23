import type {
  RawProject,
  RawProgressProject,
  MergedProject,
  EarnedValue,
  SectionSummary,
  FieldSummary,
  WeeklyTrend,
  AllocationTrend,
  OutsourcingTrend,
  RawOutsourcingRecord,
  ResponsibleSection,
  Field,
} from "./types";
import { dateToWeekIndex, WEEKS, WEEK_DATES } from "./weeks";

// ===== データマージ =====

export function mergeProjects(
  rawProjects: RawProject[],
  progressProjects: RawProgressProject[]
): MergedProject[] {
  // 進捗データを業務番号でインデックス化
  const progressMap = new Map<string, RawProgressProject>();
  for (const pp of progressProjects) {
    const key = pp.number ?? pp.id;
    if (!key) continue;
    progressMap.set(key, pp);
  }

  return rawProjects.map((rp): MergedProject => {
    const pp = progressMap.get(rp.number);
    const wp =
      pp?.weeklyProgress ??
      (pp?.wp ? [...pp.wp] : Array<null>(51).fill(null));

    return {
      number: rp.number,
      name: rp.name,
      field: rp.field,
      status: rp.status,
      contractAmount: rp.contractAmount ?? null,
      allocationSection1: rp.allocationSection1 ?? null,
      allocationSection2: rp.allocationSection2 ?? null,
      allocationSection3: rp.allocationSection3 ?? null,
      responsibleSections: rp.responsibleSections ?? [],
      weeklyProgress: wp,
      startDate: rp.startDate,
      endDate: rp.endDate,
    };
  });
}

// ===== 進捗率取得 =====

/** 指定日時点の進捗率を週次配列から取得 */
export function getProgressAtDate(
  weeklyProgress: (number | null)[],
  date: Date
): number {
  const idx = dateToWeekIndex(date);
  if (idx < 0) return 0;

  // 指定週以前の最後の非null値を探す
  for (let i = Math.min(idx, weeklyProgress.length - 1); i >= 0; i--) {
    const v = weeklyProgress[i];
    if (v !== null) return v;
  }
  return 0;
}

/** 最新の進捗率（最後の非null値）を取得 */
export function getLatestProgress(weeklyProgress: (number | null)[]): number {
  for (let i = weeklyProgress.length - 1; i >= 0; i--) {
    const v = weeklyProgress[i];
    if (v !== null) return v;
  }
  return 0;
}

// ===== 出来高算出 =====

/** 単一業務の出来高を算出 */
export function calcEarnedValue(
  project: MergedProject,
  date: Date
): EarnedValue {
  const progressRate = getProgressAtDate(project.weeklyProgress, date);
  const r = progressRate / 100;

  const s1 = project.allocationSection1 ? Math.round(project.allocationSection1 * r) : 0;
  const s2 = project.allocationSection2 ? Math.round(project.allocationSection2 * r) : 0;
  const s3 = project.allocationSection3 ? Math.round(project.allocationSection3 * r) : 0;

  // 出来高合計は課別配分の合計とする（1課+2課+3課）
  const total = s1 + s2 + s3;

  return { project, progressRate, total, section1: s1, section2: s2, section3: s3 };
}

/** 全業務の出来高を算出 */
export function calcAllEarnedValues(
  projects: MergedProject[],
  date: Date
): EarnedValue[] {
  return projects.map((p) => calcEarnedValue(p, date));
}

// ===== 集計 =====

/** 課別の出来高・契約金額を集計 */
export function calcSectionSummary(evs: EarnedValue[]): SectionSummary[] {
  const sections: ResponsibleSection[] = ["1課", "2課", "3課"];
  return sections.map((section) => {
    let earnedValue = 0;
    let contractAmount = 0;

    for (const ev of evs) {
      const sectionIndex = sections.indexOf(section) + 1;
      if (sectionIndex === 1) {
        earnedValue += ev.section1;
        contractAmount += ev.project.allocationSection1 ?? 0;
      } else if (sectionIndex === 2) {
        earnedValue += ev.section2;
        contractAmount += ev.project.allocationSection2 ?? 0;
      } else {
        earnedValue += ev.section3;
        contractAmount += ev.project.allocationSection3 ?? 0;
      }
    }

    return { section, earnedValue, contractAmount };
  });
}

/** 分野別の出来高・契約金額を集計 */
export function calcFieldSummary(evs: EarnedValue[]): FieldSummary[] {
  const fieldMap = new Map<Field, { earned: number; contract: number; count: number }>();

  for (const ev of evs) {
    const f = ev.project.field;
    const existing = fieldMap.get(f) ?? { earned: 0, contract: 0, count: 0 };
    const sectionAllocationTotal =
      (ev.project.allocationSection1 ?? 0) +
      (ev.project.allocationSection2 ?? 0) +
      (ev.project.allocationSection3 ?? 0);
    fieldMap.set(f, {
      earned: existing.earned + ev.total,
      contract: existing.contract + sectionAllocationTotal,
      count: existing.count + 1,
    });
  }

  return Array.from(fieldMap.entries()).map(([field, v]) => ({
    field,
    earnedValue: v.earned,
    contractAmount: v.contract,
    projectCount: v.count,
  }));
}

/** 週次推移（全51週分）を算出 */
export function calcWeeklyTrend(projects: MergedProject[]): WeeklyTrend[] {
  return WEEKS.map((weekLabel, weekIndex) => {
    const weekDate = WEEK_DATES[weekIndex];
    let totalEarned = 0;
    let section1Earned = 0;
    let section2Earned = 0;
    let section3Earned = 0;
    let totalContract = 0;

    for (const project of projects) {
      const progressRate = getProgressAtDate(project.weeklyProgress, weekDate);
      const r = progressRate / 100;

      section1Earned += project.allocationSection1 ? Math.round(project.allocationSection1 * r) : 0;
      section2Earned += project.allocationSection2 ? Math.round(project.allocationSection2 * r) : 0;
      section3Earned += project.allocationSection3 ? Math.round(project.allocationSection3 * r) : 0;
      totalContract +=
        (project.allocationSection1 ?? 0) +
        (project.allocationSection2 ?? 0) +
        (project.allocationSection3 ?? 0);
    }

    totalEarned = section1Earned + section2Earned + section3Earned;

    return {
      weekLabel,
      weekDate,
      totalEarned,
      section1Earned,
      section2Earned,
      section3Earned,
      totalContract,
    };
  });
}

/** 課別配分金額の累計推移を算出（工期開始日に金額が積み上がる） */
export function calcAllocationTrend(projects: MergedProject[]): AllocationTrend[] {
  return WEEKS.map((weekLabel, i) => {
    const weekDate = WEEK_DATES[i];
    let s1 = 0;
    let s2 = 0;
    let s3 = 0;
    for (const p of projects) {
      if (new Date(p.startDate) <= weekDate) {
        s1 += p.allocationSection1 ?? 0;
        s2 += p.allocationSection2 ?? 0;
        s3 += p.allocationSection3 ?? 0;
      }
    }
    return { weekLabel, weekDate, section1: s1, section2: s2, section3: s3, total: s1 + s2 + s3 };
  });
}

/** 外注委託金額の累計推移を算出（外注工期開始日に金額が積み上がる） */
export function calcOutsourcingTrend(records: RawOutsourcingRecord[]): OutsourcingTrend[] {
  return WEEKS.map((weekLabel, i) => {
    const weekDate = WEEK_DATES[i];
    let total = 0;
    for (const rec of records) {
      if (rec.latestStartDate && new Date(rec.latestStartDate) <= weekDate) {
        total += rec.latestAmount;
      }
    }
    return { weekLabel, weekDate, total };
  });
}

// ===== フォーマット =====

/** 金額を万円単位で表示（例: 1,234万円） */
export function formatManYen(value: number): string {
  const man = Math.round(value / 10000);
  return man.toLocaleString("ja-JP") + "万円";
}

/** 金額を円で表示 */
export function formatYen(value: number): string {
  return value.toLocaleString("ja-JP") + "円";
}

/** 達成率を表示 */
export function formatRate(earned: number, contract: number): string {
  if (contract === 0) return "—";
  return ((earned / contract) * 100).toFixed(1) + "%";
}
