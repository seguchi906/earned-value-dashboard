"use client";

import { useRef } from "react";

interface FileUploaderProps {
  label: string;
  accept: string;
  loadedAt: string | null;
  count: number | null;
  fileTitle?: string | null;
  onFile: (text: string) => void;
  onError: (msg: string) => void;
}

export default function FileUploader({
  label,
  accept,
  loadedAt,
  count,
  fileTitle,
  onFile,
  onError,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        onFile(text);
      }
    };
    reader.onerror = () => onError("ファイルの読み込みに失敗しました。");
    reader.readAsText(file, "utf-8");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const isLoaded = loadedAt !== null && count !== null && count > 0;

  return (
    <div
      className="border-2 border-dashed rounded-xl p-4 flex flex-col gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      style={{ borderColor: isLoaded ? "#16a34a" : "#d1d5db" }}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {isLoaded ? "✓" : "📂"}
        </span>
        <span className="font-semibold text-gray-700 text-sm">{label}</span>
      </div>

      {isLoaded ? (
        <div className="text-xs text-green-700 space-y-0.5">
          {fileTitle && <div className="font-medium">{fileTitle}</div>}
          <div>{count}件 登録済み</div>
          <div>読み込み日時: {formatDate(loadedAt)}</div>
        </div>
      ) : (
        <div className="text-xs text-gray-400">
          クリックまたはドラッグ&ドロップでファイルを選択
        </div>
      )}
    </div>
  );
}
