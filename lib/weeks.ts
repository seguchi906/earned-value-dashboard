/**
 * 進捗ダッシュボードと同一の51週定義（2025/7/4〜2026/6/26）
 * インデックス0 = 7/4（2025年）、インデックス26 = 1/9（2026年）
 */
export const WEEKS: string[] = [
  // 2025年 7〜12月
  "7/4", "7/11", "7/18", "7/25",
  "8/1", "8/8", "8/15", "8/22", "8/29",
  "9/5", "9/12", "9/19", "9/26",
  "10/3", "10/10", "10/17", "10/24", "10/31",
  "11/7", "11/14", "11/21", "11/28",
  "12/5", "12/12", "12/19", "12/26",
  // 2026年 1〜6月
  "1/9", "1/16", "1/23", "1/30",
  "2/6", "2/13", "2/20", "2/27",
  "3/6", "3/13", "3/20", "3/27",
  "4/3", "4/10", "4/17", "4/24",
  "5/1", "5/8", "5/15", "5/22", "5/29",
  "6/5", "6/12", "6/19", "6/26",
];

/** 各週を Date オブジェクトに変換（7/4〜12/26は2025年、1/9〜6/26は2026年） */
export const WEEK_DATES: Date[] = WEEKS.map((w, i) => {
  const [month, day] = w.split("/").map(Number);
  // インデックス0〜25が2025年（7〜12月）、26〜50が2026年（1〜6月）
  const year = i <= 25 ? 2025 : 2026;
  return new Date(year, month - 1, day);
});

/**
 * 指定日に対応する週インデックスを返す。
 * - 指定日がいずれかの週日以降で、次の週日より前のとき、その週のインデックスを返す。
 * - 範囲外（最初の週より前）は -1、最後の週以降は 50 を返す。
 */
export function dateToWeekIndex(date: Date): number {
  const t = date.getTime();
  // 範囲前
  if (t < WEEK_DATES[0].getTime()) return -1;
  // 範囲後
  if (t >= WEEK_DATES[WEEK_DATES.length - 1].getTime()) return WEEK_DATES.length - 1;

  for (let i = WEEK_DATES.length - 1; i >= 0; i--) {
    if (t >= WEEK_DATES[i].getTime()) return i;
  }
  return -1;
}

/** 週インデックスから表示用ラベルを返す（"7/4" 形式） */
export function weekIndexToLabel(index: number): string {
  if (index < 0 || index >= WEEKS.length) return "";
  return WEEKS[index];
}

/** 週インデックスから Date を返す */
export function weekIndexToDate(index: number): Date | null {
  if (index < 0 || index >= WEEK_DATES.length) return null;
  return WEEK_DATES[index];
}
