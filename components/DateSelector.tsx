"use client";

import { WEEKS, WEEK_DATES } from "@/lib/weeks";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: "date" | "trend";
  onViewModeChange: (mode: "date" | "trend") => void;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
  viewMode,
  onViewModeChange,
}: DateSelectorProps) {
  const toInputValue = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const minDate = WEEK_DATES[0];
  const maxDate = WEEK_DATES[WEEK_DATES.length - 1];

  // 週ボタン（4週ごと + 最終週6/26を表示）
  const weekButtons = WEEKS.flatMap((label, i) => {
    if (!(i % 4 === 0 || i === WEEKS.length - 1)) return [];
    const d = WEEK_DATES[i];
    const isSelected =
      selectedDate.getFullYear() === d.getFullYear() &&
      selectedDate.getMonth() === d.getMonth() &&
      selectedDate.getDate() === d.getDate();
    return [{ label, d, isSelected }];
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="font-semibold text-gray-700 text-sm">基準日</span>

        {/* 表示モード切り替え */}
        <div className="flex rounded-lg overflow-hidden border border-gray-300 text-sm">
          <button
            className={`px-3 py-1.5 transition-colors ${
              viewMode === "date"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => onViewModeChange("date")}
          >
            日付指定
          </button>
          <button
            className={`px-3 py-1.5 transition-colors border-l border-gray-300 ${
              viewMode === "trend"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => onViewModeChange("trend")}
          >
            週次推移
          </button>
        </div>

        {viewMode === "date" && (
          <>
            <input
              type="date"
              value={toInputValue(selectedDate)}
              min={toInputValue(minDate)}
              max={toInputValue(maxDate)}
              onChange={(e) => {
                if (e.target.value) onDateChange(new Date(e.target.value));
              }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
              onClick={() => onDateChange(new Date())}
            >
              今日
            </button>
          </>
        )}
      </div>

      {viewMode === "date" && (
        <div className="flex flex-wrap gap-1.5">
          {weekButtons.map(({ label, d, isSelected }) => (
            <button
              key={label}
              onClick={() => onDateChange(d)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {viewMode === "date" && (
        <div className="text-xs text-gray-500">
          基準日:{" "}
          <span className="font-medium text-gray-700">
            {selectedDate.getFullYear()}年
            {selectedDate.getMonth() + 1}月
            {selectedDate.getDate()}日
          </span>{" "}
          時点の出来高を表示
        </div>
      )}

      {viewMode === "trend" && (
        <div className="text-xs text-gray-500">
          2025年7月〜2026年6月の週次推移グラフを表示
        </div>
      )}
    </div>
  );
}
