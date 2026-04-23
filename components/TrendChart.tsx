"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { WeeklyTrend, AllocationTrend, OutsourcingTrend } from "@/lib/types";
import { formatManYen } from "@/lib/calculate";

interface TrendChartProps {
  trends: WeeklyTrend[];
  allocationTrends: AllocationTrend[];
  outsourcingTrends: OutsourcingTrend[];
}

// 出来高キー（前週比増加額を表示する対象）
const EARNED_KEYS = ["合計出来高", "1課出来高", "2課出来高", "3課出来高"] as const;
type EarnedKey = (typeof EARNED_KEYS)[number];

interface DisplayRow {
  week: string;
  合計出来高: number;
  "1課出来高": number;
  "2課出来高": number;
  "3課出来高": number;
  合計配分累計: number;
  "1課配分累計": number;
  "2課配分累計": number;
  "3課配分累計": number;
  外注累計: number;
  合計出来高増加: number;
  "1課出来高増加": number;
  "2課出来高増加": number;
  "3課出来高増加": number;
}

// カスタムツールチップ
function CustomTooltip({
  active,
  payload,
  label,
  showAllocation,
  showOutsourcing,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  showAllocation: boolean;
  showOutsourcing: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;

  // payload からデータを取得（増加額フィールドは非表示ラインとして渡される）
  const dataMap: Record<string, number> = {};
  for (const entry of payload) {
    dataMap[entry.name] = entry.value;
  }

  const fmt = (v: number) => `${v.toLocaleString("ja-JP")}万円`;
  const fmtIncrease = (v: number) => {
    if (v === 0) return null;
    return (
      <span className={v > 0 ? "text-green-600" : "text-red-500"}>
        {v > 0 ? "+" : ""}{v.toLocaleString("ja-JP")}万円
      </span>
    );
  };

  // 表示する行を組み立て（payload の順序に従う）
  const rows = payload
    .filter((p) => !p.name.endsWith("増加")) // 増加額ラインは非表示
    .filter((p) => p.name !== "外注累計" || showOutsourcing)
    .map((p) => {
      const isEarned = (EARNED_KEYS as readonly string[]).includes(p.name);
      const increaseKey = `${p.name}増加`;
      const increaseVal = dataMap[increaseKey] ?? 0;
      return { name: p.name, value: p.value, color: p.color, isEarned, increaseVal };
    });

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs min-w-48">
      <div className="font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-1">
        {label}
      </div>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.name} className="flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-1 text-gray-600 flex-shrink-0">
              <span
                className="inline-block w-2.5 h-0.5 rounded"
                style={{ backgroundColor: row.color }}
              />
              {row.name}
            </span>
            <span className="font-medium text-gray-800 text-right">
              {fmt(row.value)}
              {row.isEarned && row.increaseVal !== 0 && (
                <span className="ml-1.5 font-normal text-xs">
                  {fmtIncrease(row.increaseVal)}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrendChart({ trends, allocationTrends, outsourcingTrends }: TrendChartProps) {
  const [showAllocation, setShowAllocation] = useState(true);
  const [showOutsourcing, setShowOutsourcing] = useState(true);

  const today = new Date();

  // 進捗データが存在する最後の週インデックス
  let lastDataIndex = 0;
  for (let i = trends.length - 1; i >= 0; i--) {
    if (trends[i].totalEarned > 0) {
      lastDataIndex = i;
      break;
    }
  }

  // WeeklyTrend と AllocationTrend と OutsourcingTrend をマージして displayData を作成（前週比増加額も追加）
  const displayData: DisplayRow[] = trends.map((t, i) => {
    const prev = i > 0 ? trends[i - 1] : null;
    return {
      week: t.weekLabel,
      合計出来高: Math.round(t.totalEarned / 10000),
      "1課出来高": Math.round(t.section1Earned / 10000),
      "2課出来高": Math.round(t.section2Earned / 10000),
      "3課出来高": Math.round(t.section3Earned / 10000),
      合計配分累計: allocationTrends[i] ? Math.round(allocationTrends[i].total / 10000) : 0,
      "1課配分累計": allocationTrends[i] ? Math.round(allocationTrends[i].section1 / 10000) : 0,
      "2課配分累計": allocationTrends[i] ? Math.round(allocationTrends[i].section2 / 10000) : 0,
      "3課配分累計": allocationTrends[i] ? Math.round(allocationTrends[i].section3 / 10000) : 0,
      外注累計: outsourcingTrends[i] ? Math.round(outsourcingTrends[i].total / 10000) : 0,
      合計出来高増加: prev ? Math.round((t.totalEarned - prev.totalEarned) / 10000) : 0,
      "1課出来高増加": prev ? Math.round((t.section1Earned - prev.section1Earned) / 10000) : 0,
      "2課出来高増加": prev ? Math.round((t.section2Earned - prev.section2Earned) / 10000) : 0,
      "3課出来高増加": prev ? Math.round((t.section3Earned - prev.section3Earned) / 10000) : 0,
    };
  });

  // 今日に最も近い週
  const todayWeek = trends.reduce(
    (prev, curr) =>
      Math.abs(curr.weekDate.getTime() - today.getTime()) <
      Math.abs(prev.weekDate.getTime() - today.getTime())
        ? curr
        : prev,
    trends[0]
  );

  // 4週ごとにX軸ラベルを表示
  const showTick = (weekLabel: string) => {
    const idx = trends.findIndex((t) => t.weekLabel === weekLabel);
    return idx % 4 === 0 ? weekLabel : "";
  };

  const toggleButtons = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowAllocation((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
          showAllocation
            ? "bg-gray-700 text-white border-gray-700"
            : "bg-white text-gray-500 border-gray-300 hover:border-gray-500"
        }`}
      >
        <span
          className="inline-block w-6 border-t-2"
          style={{
            borderStyle: "dashed",
            borderColor: showAllocation ? "white" : "#9ca3af",
          }}
        />
        配分累計
      </button>
      <button
        onClick={() => setShowOutsourcing((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
          showOutsourcing
            ? "bg-orange-500 text-white border-orange-500"
            : "bg-white text-gray-500 border-gray-300 hover:border-gray-500"
        }`}
      >
        <span
          className="inline-block w-6 border-t-2"
          style={{
            borderStyle: "dashed",
            borderColor: showOutsourcing ? "white" : "#9ca3af",
          }}
        />
        外注累計
      </button>
    </div>
  );

  // 増加額ライン（非表示・ツールチップ用データのみ）
  const increaseLines = (
    <>
      <Line dataKey="合計出来高増加" stroke="transparent" dot={false} legendType="none" />
      <Line dataKey="1課出来高増加" stroke="transparent" dot={false} legendType="none" />
      <Line dataKey="2課出来高増加" stroke="transparent" dot={false} legendType="none" />
      <Line dataKey="3課出来高増加" stroke="transparent" dot={false} legendType="none" />
    </>
  );

  const HIDDEN_LEGEND_KEYS = [
    "合計出来高増加", "1課出来高増加", "2課出来高増加", "3課出来高増加",
  ] as string[];

  return (
    <div className="space-y-4">
      {/* 合計推移 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-700">
            週次推移 — 全体出来高（万円）
          </h3>
          {toggleButtons}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={displayData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10 }}
              tickFormatter={showTick}
              interval={0}
            />
            <YAxis
              tickFormatter={(v) => `${v.toLocaleString()}万`}
              tick={{ fontSize: 11 }}
              width={70}
            />
            <Tooltip
              content={<CustomTooltip showAllocation={showAllocation} showOutsourcing={showOutsourcing} />}
            />
            <Legend
              formatter={(value) =>
                HIDDEN_LEGEND_KEYS.includes(value) ? null : value
              }
            />
            {todayWeek && (
              <ReferenceLine
                x={todayWeek.weekLabel}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: "今日", position: "top", fontSize: 11, fill: "#ef4444" }}
              />
            )}
            {showAllocation && (
              <Line
                type="stepAfter"
                dataKey="合計配分累計"
                stroke="#9ca3af"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
            {showOutsourcing && (
              <Line
                type="stepAfter"
                dataKey="外注累計"
                stroke="#f97316"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
            <Line
              type="monotone"
              dataKey="合計出来高"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {/* 増加額データ（非表示ライン・ツールチップ用） */}
            <Line dataKey="合計出来高増加" stroke="transparent" dot={false} legendType="none" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 課別推移 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-700">
            週次推移 — 課別出来高（万円）
          </h3>
          {toggleButtons}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={displayData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10 }}
              tickFormatter={showTick}
              interval={0}
            />
            <YAxis
              tickFormatter={(v) => `${v.toLocaleString()}万`}
              tick={{ fontSize: 11 }}
              width={70}
            />
            <Tooltip
              content={<CustomTooltip showAllocation={showAllocation} showOutsourcing={showOutsourcing} />}
            />
            <Legend
              formatter={(value) =>
                HIDDEN_LEGEND_KEYS.includes(value) ? null : value
              }
            />
            {todayWeek && (
              <ReferenceLine
                x={todayWeek.weekLabel}
                stroke="#ef4444"
                strokeDasharray="4 4"
              />
            )}
            {/* 配分累計（破線） */}
            {showAllocation && (
              <>
                <Line
                  type="stepAfter"
                  dataKey="1課配分累計"
                  stroke="#93c5fd"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                />
                <Line
                  type="stepAfter"
                  dataKey="2課配分累計"
                  stroke="#86efac"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                />
                <Line
                  type="stepAfter"
                  dataKey="3課配分累計"
                  stroke="#d8b4fe"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                />
              </>
            )}
            {/* 外注累計（課別グラフには合計のみ表示） */}
            {showOutsourcing && (
              <Line
                type="stepAfter"
                dataKey="外注累計"
                stroke="#f97316"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
              />
            )}
            {/* 出来高（実線） */}
            <Line
              type="monotone"
              dataKey="1課出来高"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="2課出来高"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="3課出来高"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
            />
            {/* 増加額データ（非表示ライン・ツールチップ用） */}
            {increaseLines}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 週別データテーブル */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">週別データ（最新20週）</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">週</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">出来高合計</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-400">前週比</th>
                <th className="px-3 py-2 text-right font-semibold text-blue-600">1課出来高</th>
                <th className="px-3 py-2 text-right font-semibold text-green-600">2課出来高</th>
                <th className="px-3 py-2 text-right font-semibold text-purple-600">3課出来高</th>
                {showAllocation && (
                  <>
                    <th className="px-3 py-2 text-right font-semibold text-gray-400">配分累計</th>
                    <th className="px-3 py-2 text-right font-semibold text-blue-300">1課配分</th>
                    <th className="px-3 py-2 text-right font-semibold text-green-300">2課配分</th>
                    <th className="px-3 py-2 text-right font-semibold text-purple-300">3課配分</th>
                  </>
                )}
                {showOutsourcing && (
                  <th className="px-3 py-2 text-right font-semibold text-orange-500">外注累計</th>
                )}
                <th className="px-3 py-2 text-right font-semibold text-gray-600">達成率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trends
                .slice(Math.max(0, lastDataIndex - 18), lastDataIndex + 2)
                .reverse()
                .map((t, ri) => {
                  const origIdx =
                    Math.max(0, lastDataIndex - 18) +
                    (lastDataIndex + 2 - Math.max(0, lastDataIndex - 18) - 1 - ri);
                  const alloc = allocationTrends[origIdx];
                  const prevTrend = origIdx > 0 ? trends[origIdx - 1] : null;
                  const totalIncrease = prevTrend
                    ? Math.round((t.totalEarned - prevTrend.totalEarned) / 10000)
                    : null;
                  const rate =
                    alloc && alloc.total > 0
                      ? ((t.totalEarned / alloc.total) * 100).toFixed(1)
                      : "—";
                  const isCurrentWeek = t.weekLabel === todayWeek?.weekLabel;
                  return (
                    <tr
                      key={t.weekLabel}
                      className={isCurrentWeek ? "bg-red-50" : "hover:bg-gray-50"}
                    >
                      <td className="px-3 py-2 font-medium text-gray-700">
                        {t.weekLabel}
                        {isCurrentWeek && (
                          <span className="ml-1 text-red-500 text-xs">◀ 今</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-800 font-semibold">
                        {formatManYen(t.totalEarned)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {totalIncrease !== null && totalIncrease !== 0 ? (
                          <span
                            className={
                              totalIncrease > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"
                            }
                          >
                            {totalIncrease > 0 ? "+" : ""}
                            {totalIncrease.toLocaleString("ja-JP")}万円
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-blue-700">
                        {formatManYen(t.section1Earned)}
                      </td>
                      <td className="px-3 py-2 text-right text-green-700">
                        {formatManYen(t.section2Earned)}
                      </td>
                      <td className="px-3 py-2 text-right text-purple-700">
                        {formatManYen(t.section3Earned)}
                      </td>
                      {showAllocation && alloc && (
                        <>
                          <td className="px-3 py-2 text-right text-gray-400">
                            {formatManYen(alloc.total)}
                          </td>
                          <td className="px-3 py-2 text-right text-blue-300">
                            {formatManYen(alloc.section1)}
                          </td>
                          <td className="px-3 py-2 text-right text-green-300">
                            {formatManYen(alloc.section2)}
                          </td>
                          <td className="px-3 py-2 text-right text-purple-300">
                            {formatManYen(alloc.section3)}
                          </td>
                        </>
                      )}
                      {showOutsourcing && (
                        <td className="px-3 py-2 text-right text-orange-500">
                          {outsourcingTrends[origIdx]
                            ? formatManYen(outsourcingTrends[origIdx].total)
                            : "—"}
                        </td>
                      )}
                      <td className="px-3 py-2 text-right font-semibold text-gray-700">
                        {rate}{rate !== "—" ? "%" : ""}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
