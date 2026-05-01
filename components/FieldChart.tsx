"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { FieldSummary } from "@/lib/types";
import { formatRate } from "@/lib/calculate";

interface FieldChartProps {
  fieldSummary: FieldSummary[];
}

const FIELD_COLORS: Record<string, string> = {
  道路: "#3b82f6",
  "河川・砂防": "#06b6d4",
  橋梁設計: "#8b5cf6",
  点検: "#f59e0b",
  積算補助: "#10b981",
  急傾斜地: "#ef4444",
  災害: "#f97316",
  下水道: "#6366f1",
};

const DEFAULT_COLOR = "#9ca3af";

export default function FieldChart({ fieldSummary }: FieldChartProps) {
  const sorted = [...fieldSummary].sort((a, b) => b.earnedValue - a.earnedValue);

  const barData = sorted.map((fs) => ({
    name: fs.field,
    出来高: Math.round(fs.earnedValue / 10000),
    契約金額: Math.round(fs.contractAmount / 10000),
    外注費: Math.round(fs.outsourcingAmount / 10000),
  }));

  const pieData = sorted
    .filter((fs) => fs.earnedValue > 0)
    .map((fs) => ({
      name: fs.field,
      value: Math.round(fs.earnedValue / 10000),
    }));

  return (
    <div className="space-y-4">
      {/* 棒グラフ */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          分野別 出来高・契約金額（万円）
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={barData}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis
              type="number"
              tickFormatter={(v) => `${v.toLocaleString()}万`}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={56}
            />
            <Tooltip
              formatter={(value) => [
                `${Number(value).toLocaleString("ja-JP")}万円`,
              ]}
            />
            <Legend />
            <Bar dataKey="出来高" radius={[0, 4, 4, 0]}>
              {barData.map((entry) => (
                <rect
                  key={entry.name}
                  fill={FIELD_COLORS[entry.name] ?? DEFAULT_COLOR}
                />
              ))}
            </Bar>
            <Bar dataKey="契約金額" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
            <Bar dataKey="外注費" fill="#f97316" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 円グラフ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            分野別 出来高構成比
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ percent }: { percent?: number }) =>
                    (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ""
                  }
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={FIELD_COLORS[entry.name] ?? DEFAULT_COLOR}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString()}万円`]}
                />
                <Legend
                  iconSize={10}
                  formatter={(value) => (
                    <span style={{ fontSize: 11 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              出来高データなし
            </div>
          )}
        </div>

        {/* 分野別テーブル */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">分野別 達成率</h3>
          <div className="space-y-2">
            {sorted.map((fs) => {
              const rate =
                fs.contractAmount > 0
                  ? (fs.earnedValue / fs.contractAmount) * 100
                  : 0;
              const color = FIELD_COLORS[fs.field] ?? DEFAULT_COLOR;
              return (
                <div key={fs.field} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-700 w-20 flex-shrink-0">
                    {fs.field}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(rate, 100)}%`,
                        backgroundColor: color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right" style={{ color }}>
                    {formatRate(fs.earnedValue, fs.contractAmount)}
                  </span>
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {fs.projectCount}件
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
