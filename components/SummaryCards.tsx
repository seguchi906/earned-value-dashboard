"use client";

import type { EarnedValue, SectionSummary } from "@/lib/types";
import { formatManYen, formatRate } from "@/lib/calculate";

interface SummaryCardsProps {
  earnedValues: EarnedValue[];
  sectionSummary: SectionSummary[];
}

export default function SummaryCards({
  earnedValues,
  sectionSummary,
}: SummaryCardsProps) {
  const totalEarned = earnedValues.reduce((s, ev) => s + ev.total, 0);
  const totalOutsourcingEarned = earnedValues.reduce(
    (s, ev) =>
      s +
      Math.round((ev.project.outsourcingAmount ?? 0) * (ev.progressRate / 100)),
    0
  );
  const totalContract = earnedValues.reduce(
    (s, ev) =>
      s +
      (ev.project.allocationSection1 ?? 0) +
      (ev.project.allocationSection2 ?? 0) +
      (ev.project.allocationSection3 ?? 0),
    0
  );
  const achievementRate = totalContract > 0 ? (totalEarned / totalContract) * 100 : 0;

  const progressProjects = earnedValues.filter((ev) => ev.progressRate < 100);
  const completedProjects = earnedValues.filter((ev) => ev.progressRate >= 100);

  const sectionColors: Record<string, string> = {
    "1課": "bg-blue-50 border-blue-200",
    "2課": "bg-green-50 border-green-200",
    "3課": "bg-purple-50 border-purple-200",
  };
  const sectionTextColors: Record<string, string> = {
    "1課": "text-blue-700",
    "2課": "text-green-700",
    "3課": "text-purple-700",
  };

  return (
    <div className="space-y-3">
      {/* 全体サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">出来高合計</div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold text-gray-900">
              {formatManYen(totalEarned)}
            </span>
            <span className="text-sm font-semibold text-orange-600">
              （外注{formatManYen(totalOutsourcingEarned)}）
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            契約金額計: {formatManYen(totalContract)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">達成率</div>
          <div className="text-2xl font-bold text-gray-900">
            {achievementRate.toFixed(1)}%
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(achievementRate, 100)}%`,
                backgroundColor:
                  achievementRate >= 80
                    ? "#16a34a"
                    : achievementRate >= 50
                    ? "#ca8a04"
                    : "#dc2626",
              }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">業務数</div>
          <div className="text-2xl font-bold text-gray-900">
            {earnedValues.length}件
          </div>
          <div className="text-xs text-gray-400 mt-1 space-y-0.5">
            <div>進行中: {progressProjects.length}件</div>
            <div>完納: {completedProjects.length}件</div>
          </div>
        </div>
      </div>

      {/* 課別サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sectionSummary.map((ss) => (
          <div
            key={ss.section}
            className={`rounded-xl border p-4 ${sectionColors[ss.section] ?? "bg-gray-50 border-gray-200"}`}
          >
            <div className={`text-xs font-semibold mb-1 ${sectionTextColors[ss.section] ?? "text-gray-700"}`}>
              {ss.section}
            </div>
            <div className="text-xl font-bold text-gray-900">
              {formatManYen(ss.earnedValue)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              契約: {formatManYen(ss.contractAmount)}
            </div>
            <div className="text-xs text-gray-500">
              達成率: {formatRate(ss.earnedValue, ss.contractAmount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
