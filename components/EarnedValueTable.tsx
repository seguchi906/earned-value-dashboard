"use client";

import { useState, useMemo } from "react";
import type { EarnedValue, Field, ResponsibleSection } from "@/lib/types";
import { ALL_FIELDS } from "@/lib/types";
import { formatManYen, formatRate } from "@/lib/calculate";

interface EarnedValueTableProps {
  earnedValues: EarnedValue[];
}

type SortKey =
  | "number"
  | "name"
  | "field"
  | "contractAmount"
  | "progressRate"
  | "total"
  | "section1"
  | "section2"
  | "section3";

const SECTION_OPTIONS: (ResponsibleSection | "すべて")[] = [
  "すべて",
  "1課",
  "2課",
  "3課",
];

/** 進捗率列の色分け（閾値以上を青） */
const COMPLETE_PROGRESS_THRESHOLD = 99.5;

function calcContractFromAllocations(ev: EarnedValue): number {
  return (
    (ev.project.allocationSection1 ?? 0) +
    (ev.project.allocationSection2 ?? 0) +
    (ev.project.allocationSection3 ?? 0)
  );
}

export default function EarnedValueTable({ earnedValues }: EarnedValueTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterField, setFilterField] = useState<Field | "すべて">("すべて");
  const [filterSection, setFilterSection] = useState<ResponsibleSection | "すべて">("すべて");
  const [searchText, setSearchText] = useState("");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return <span className="text-gray-300 ml-1">↕</span>;
    return (
      <span className="text-blue-500 ml-1">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const filtered = useMemo(() => {
    return earnedValues.filter((ev) => {
      if (filterField !== "すべて" && ev.project.field !== filterField) return false;
      if (
        filterSection !== "すべて" &&
        !ev.project.responsibleSections.includes(filterSection as ResponsibleSection)
      )
        return false;
      if (
        searchText &&
        !ev.project.name.includes(searchText) &&
        !ev.project.number.includes(searchText)
      )
        return false;
      return true;
    });
  }, [earnedValues, filterField, filterSection, searchText]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortKey) {
        case "number":
          va = a.project.number;
          vb = b.project.number;
          break;
        case "name":
          va = a.project.name;
          vb = b.project.name;
          break;
        case "field":
          va = a.project.field;
          vb = b.project.field;
          break;
        case "contractAmount":
          va = calcContractFromAllocations(a);
          vb = calcContractFromAllocations(b);
          break;
        case "progressRate":
          va = a.progressRate;
          vb = b.progressRate;
          break;
        case "total":
          va = a.total;
          vb = b.total;
          break;
        case "section1":
          va = a.section1;
          vb = b.section1;
          break;
        case "section2":
          va = a.section2;
          vb = b.section2;
          break;
        case "section3":
          va = a.section3;
          vb = b.section3;
          break;
      }
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc"
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
  }, [filtered, sortKey, sortDir]);

  const th = (label: string, key: SortKey, className = "") => (
    <th
      className={`px-3 py-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap ${className}`}
      onClick={() => handleSort(key)}
    >
      {label}
      {sortArrow(key)}
    </th>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* フィルターバー */}
      <div className="p-3 border-b border-gray-100 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="業務名・番号で検索"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
        />
        <select
          value={filterField}
          onChange={(e) => setFilterField(e.target.value as Field | "すべて")}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="すべて">全分野</option>
          {ALL_FIELDS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value as ResponsibleSection | "すべて")}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SECTION_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === "すべて" ? "全課" : s}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500 ml-auto">{sorted.length}件表示</span>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {th("業務番号", "number", "w-24")}
              {th("業務名", "name", "min-w-48")}
              {th("分野", "field", "w-24")}
              {th("契約金額", "contractAmount", "w-28 text-right")}
              {th("進捗率", "progressRate", "w-20 text-right")}
              {th("出来高", "total", "w-28 text-right")}
              {th("1課", "section1", "w-24 text-right")}
              {th("2課", "section2", "w-24 text-right")}
              {th("3課", "section3", "w-24 text-right")}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-400 text-sm">
                  表示するデータがありません
                </td>
              </tr>
            ) : (
              sorted.map((ev) => (
                <tr key={ev.project.number} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-xs text-gray-500 font-mono">{ev.project.number}</td>
                  <td className="px-3 py-2 text-xs text-gray-800 max-w-xs">
                    <div className="truncate" title={ev.project.name}>
                      {ev.project.name}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {ev.project.field}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-right text-gray-700">
                    {formatManYen(calcContractFromAllocations(ev))}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={`text-xs font-semibold ${
                        ev.progressRate >= COMPLETE_PROGRESS_THRESHOLD
                          ? "text-blue-600"
                          : ev.progressRate >= 70
                          ? "text-green-600"
                          : ev.progressRate >= 30
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {ev.progressRate}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-right font-semibold text-gray-800">
                    {ev.total > 0 ? formatManYen(ev.total) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-right text-blue-700">
                    {ev.section1 > 0 ? formatManYen(ev.section1) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-right text-green-700">
                    {ev.section2 > 0 ? formatManYen(ev.section2) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-right text-purple-700">
                    {ev.section3 > 0 ? formatManYen(ev.section3) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* フッター集計 */}
      {sorted.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-4 text-xs text-gray-600">
          <span>
            出来高合計:{" "}
            <span className="font-bold text-gray-800">
              {formatManYen(sorted.reduce((s, ev) => s + ev.total, 0))}
            </span>
          </span>
          <span>
            1課:{" "}
            <span className="font-bold text-blue-700">
              {formatManYen(sorted.reduce((s, ev) => s + ev.section1, 0))}
            </span>
          </span>
          <span>
            2課:{" "}
            <span className="font-bold text-green-700">
              {formatManYen(sorted.reduce((s, ev) => s + ev.section2, 0))}
            </span>
          </span>
          <span>
            3課:{" "}
            <span className="font-bold text-purple-700">
              {formatManYen(sorted.reduce((s, ev) => s + ev.section3, 0))}
            </span>
          </span>
          <span>
            達成率:{" "}
            <span className="font-bold text-gray-800">
              {formatRate(
                sorted.reduce((s, ev) => s + ev.total, 0),
                sorted.reduce((s, ev) => s + calcContractFromAllocations(ev), 0)
              )}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
