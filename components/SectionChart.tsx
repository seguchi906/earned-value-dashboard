"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { SectionSummary } from "@/lib/types";

interface SectionChartProps {
  sectionSummary: SectionSummary[];
}

const formatManYen = (value: number) =>
  `${Math.round(value / 10000).toLocaleString("ja-JP")}万円`;

const COLORS: Record<string, string> = {
  "1課": "#3b82f6",
  "2課": "#22c55e",
  "3課": "#a855f7",
};

export default function SectionChart({ sectionSummary }: SectionChartProps) {
  const data = sectionSummary.map((ss) => ({
    name: ss.section,
    出来高: Math.round(ss.earnedValue / 10000),
    契約金額: Math.round(ss.contractAmount / 10000),
    達成率:
      ss.contractAmount > 0
        ? Math.round((ss.earnedValue / ss.contractAmount) * 1000) / 10
        : 0,
  }));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">課別 出来高・契約金額（万円）</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(v) => `${v.toLocaleString()}万`}
              tick={{ fontSize: 11 }}
              width={70}
            />
            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toLocaleString("ja-JP")}万円`,
                name,
              ]}
            />
            <Legend />
            <Bar dataKey="出来高" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <rect
                  key={entry.name}
                  fill={COLORS[entry.name as keyof typeof COLORS] ?? "#6b7280"}
                />
              ))}
            </Bar>
            <Bar dataKey="契約金額" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 達成率バー */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">課別 達成率</h3>
        <div className="space-y-4">
          {sectionSummary.map((ss) => {
            const rate =
              ss.contractAmount > 0
                ? (ss.earnedValue / ss.contractAmount) * 100
                : 0;
            const color = COLORS[ss.section] ?? "#6b7280";
            return (
              <div key={ss.section}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold" style={{ color }}>
                    {ss.section}
                  </span>
                  <span className="text-gray-600">
                    {formatManYen(ss.earnedValue)} / {formatManYen(ss.contractAmount)}{" "}
                    <span className="font-bold" style={{ color }}>
                      ({rate.toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(rate, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
