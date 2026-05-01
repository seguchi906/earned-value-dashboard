"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { StoredData, MergedProject, EarnedValue, SectionSummary, FieldSummary, WeeklyTrend, AllocationTrend, OutsourcingTrend } from "@/lib/types";
import { parseProjectsJson, parseProgressJson, parseOutsourcingCsv } from "@/lib/parsers";
import { mergeProjects, calcAllEarnedValues, calcSectionSummary, calcFieldSummary, calcWeeklyTrend, calcAllocationTrend, calcOutsourcingTrend } from "@/lib/calculate";
import { loadFromServer, updateProjects, updateProgress, updateOutsourcing, clearServerData } from "@/lib/storage";
import FileUploader from "@/components/FileUploader";
import DateSelector from "@/components/DateSelector";
import SummaryCards from "@/components/SummaryCards";
import EarnedValueTable from "@/components/EarnedValueTable";
import SectionChart from "@/components/SectionChart";
import FieldChart from "@/components/FieldChart";
import TrendChart from "@/components/TrendChart";

type TabKey = "section" | "field" | "table" | "trend";

const EMPTY_DATA: StoredData = {
  projects: [],
  progressProjects: [],
  outsourcingRecords: [],
  projectsLoadedAt: null,
  progressLoadedAt: null,
  outsourcingLoadedAt: null,
  projectsFileTitle: null,
};

export default function HomePage() {
  const [storedData, setStoredData] = useState<StoredData>(EMPTY_DATA);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"date" | "trend">("date");
  const [activeTab, setActiveTab] = useState<TabKey>("section");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // サーバーからデータを初期ロード
  useEffect(() => {
    loadFromServer()
      .then((data) => setStoredData(data))
      .finally(() => setIsLoading(false));
  }, []);

  const mergedProjects = useMemo<MergedProject[]>(
    () => mergeProjects(storedData.projects, storedData.progressProjects, storedData.outsourcingRecords ?? []),
    [storedData.projects, storedData.progressProjects, storedData.outsourcingRecords]
  );

  const earnedValues = useMemo<EarnedValue[]>(
    () =>
      viewMode === "date"
        ? calcAllEarnedValues(mergedProjects, selectedDate)
        : calcAllEarnedValues(mergedProjects, new Date()),
    [mergedProjects, selectedDate, viewMode]
  );

  const sectionSummary = useMemo<SectionSummary[]>(
    () => calcSectionSummary(earnedValues),
    [earnedValues]
  );

  const fieldSummary = useMemo<FieldSummary[]>(
    () => calcFieldSummary(earnedValues),
    [earnedValues]
  );

  const weeklyTrend = useMemo<WeeklyTrend[]>(
    () => calcWeeklyTrend(mergedProjects),
    [mergedProjects]
  );

  const allocationTrend = useMemo<AllocationTrend[]>(
    () => calcAllocationTrend(mergedProjects),
    [mergedProjects]
  );

  const outsourcingTrend = useMemo<OutsourcingTrend[]>(
    () => calcOutsourcingTrend(storedData.outsourcingRecords ?? []),
    [storedData.outsourcingRecords]
  );

  const handleProjectsFile = useCallback(async (text: string) => {
    setErrorMsg(null);
    const result = parseProjectsJson(text);
    if (result.error) {
      setErrorMsg(`全体工程表: ${result.error}`);
      return;
    }
    const next = {
      ...storedData,
      projects: result.projects,
      projectsLoadedAt: new Date().toISOString(),
      projectsFileTitle: result.title,
    };
    setStoredData(next);
    setIsSaving(true);
    updateProjects(storedData, result.projects, result.title).finally(() => setIsSaving(false));
  }, [storedData]);

  const handleProgressFile = useCallback(async (text: string) => {
    setErrorMsg(null);
    const result = parseProgressJson(text);
    if (result.error) {
      setErrorMsg(`進捗データ: ${result.error}`);
      return;
    }
    const next = {
      ...storedData,
      progressProjects: result.projects,
      progressLoadedAt: new Date().toISOString(),
    };
    setStoredData(next);
    setIsSaving(true);
    updateProgress(storedData, result.projects).finally(() => setIsSaving(false));
  }, [storedData]);

  const handleOutsourcingFile = useCallback(async (text: string) => {
    setErrorMsg(null);
    const result = parseOutsourcingCsv(text);
    if (result.error) {
      setErrorMsg(`外注データ: ${result.error}`);
      return;
    }
    const next = {
      ...storedData,
      outsourcingRecords: result.records,
      outsourcingLoadedAt: new Date().toISOString(),
    };
    setStoredData(next);
    setIsSaving(true);
    updateOutsourcing(storedData, result.records).finally(() => setIsSaving(false));
  }, [storedData]);

  const handleClear = async () => {
    if (confirm("登録されたすべてのデータを削除しますか？")) {
      setIsSaving(true);
      try {
        const next = await clearServerData();
        setStoredData(next);
        setErrorMsg(null);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const hasData = storedData.projects.length > 0;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "section", label: "課別グラフ" },
    { key: "field", label: "分野別グラフ" },
    { key: "table", label: "業務一覧" },
    { key: "trend", label: "週次推移" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">出</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-tight">出来高算出ダッシュボード</h1>
              {storedData.projectsFileTitle && (
                <p className="text-xs text-gray-500">{storedData.projectsFileTitle}</p>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isSaving && (
              <span className="text-xs text-blue-500 animate-pulse">保存中...</span>
            )}
            {hasData && !isSaving && (
              <button
                onClick={handleClear}
                className="text-xs text-red-500 hover:text-red-700 hover:underline"
              >
                データをクリア
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-5 space-y-5">
        {/* データ登録パネル */}
        <section>
          <h2 className="text-sm font-semibold text-gray-600 mb-2">データ登録</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FileUploader
              label="全体工程表 (projects-*.json)"
              accept=".json"
              loadedAt={storedData.projectsLoadedAt}
              count={storedData.projects.length}
              fileTitle={storedData.projectsFileTitle}
              onFile={handleProjectsFile}
              onError={(msg) => setErrorMsg(msg)}
            />
            <FileUploader
              label="進捗データ (progress_*.json)"
              accept=".json"
              loadedAt={storedData.progressLoadedAt}
              count={storedData.progressProjects.length}
              onFile={handleProgressFile}
              onError={(msg) => setErrorMsg(msg)}
            />
            <FileUploader
              label="外注管理表 (外注管理表_*.csv)"
              accept=".csv"
              loadedAt={storedData.outsourcingLoadedAt}
              count={(storedData.outsourcingRecords ?? []).length}
              onFile={handleOutsourcingFile}
              onError={(msg) => setErrorMsg(msg)}
            />
          </div>

          {/* エラー表示 */}
          {errorMsg && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
              <span className="flex-shrink-0">⚠</span>
              <span>{errorMsg}</span>
              <button
                className="ml-auto text-red-400 hover:text-red-600"
                onClick={() => setErrorMsg(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* マージ状況 */}
          {!isLoading && hasData && storedData.progressProjects.length > 0 && (
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              工程表 {storedData.projects.length}件 × 進捗データ {storedData.progressProjects.length}件 →
              <span className="font-semibold text-blue-700 ml-1">
                マージ済み {mergedProjects.length}件
              </span>
              （進捗データなし:{" "}
              {mergedProjects.filter((p) => p.weeklyProgress.every((v) => v === null)).length}件）
              {(storedData.outsourcingRecords ?? []).length > 0 && (
                <span className="ml-2 text-orange-600 font-medium">
                  外注 {(storedData.outsourcingRecords ?? []).length}件
                </span>
              )}
            </div>
          )}
        </section>

        {/* 初期ロード中 */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
            <div className="text-sm text-gray-400 animate-pulse">データを読み込んでいます...</div>
          </div>
        ) : !hasData ? (
          /* データ未登録時のガイド */
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">データを登録してください</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              各アプリのエクスポートボタンでJSONファイルを出力し、上のファイル選択からアップロードしてください。
            </p>
            <div className="mt-6 text-xs text-gray-400 space-y-1">
              <p>全体工程表: 「エクスポート」ボタン → <code className="bg-gray-100 px-1 rounded">projects-YYYY-MM-DD.json</code></p>
              <p>進捗ダッシュボード: 「エクスポート」ボタン → <code className="bg-gray-100 px-1 rounded">progress_YYYY-MM-DD.json</code></p>
              <p>外注管理表（任意）: 「CSV出力」ボタン → <code className="bg-gray-100 px-1 rounded">外注管理表_*.csv</code></p>
            </div>
          </div>
        ) : (
          <>
            {/* 日付選択 */}
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              viewMode={viewMode}
              onViewModeChange={(mode) => {
                setViewMode(mode);
                if (mode === "trend") setActiveTab("trend");
                else setActiveTab("section");
              }}
            />

            {/* サマリーカード */}
            {viewMode === "date" && (
              <SummaryCards
                earnedValues={earnedValues}
                sectionSummary={sectionSummary}
              />
            )}

            {/* タブ切り替え */}
            <div>
              <div className="flex gap-1 mb-3 border-b border-gray-200">
                {tabs
                  .filter((t) => viewMode === "trend" ? t.key === "trend" : t.key !== "trend")
                  .map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        activeTab === tab.key
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
              </div>

              {activeTab === "section" && (
                <SectionChart sectionSummary={sectionSummary} />
              )}
              {activeTab === "field" && (
                <FieldChart fieldSummary={fieldSummary} />
              )}
              {activeTab === "table" && (
                <EarnedValueTable earnedValues={earnedValues} />
              )}
              {activeTab === "trend" && (
                <TrendChart trends={weeklyTrend} allocationTrends={allocationTrend} outsourcingTrends={outsourcingTrend} />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
