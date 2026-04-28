"use client";

import { useId, useRef } from "react";

interface FileUploaderProps {
  label: string;
  accept: string;
  loadedAt: string | null;
  count: number | null;
  fileTitle?: string | null;
  onFile: (text: string) => void | Promise<void>;
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
  const inputId = useId();

  const isLoaded = loadedAt !== null && count !== null && count > 0;

  const decodeText = (buffer: ArrayBuffer) => {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      return new TextDecoder("shift_jis").decode(buffer);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        if (!(reader.result instanceof ArrayBuffer)) {
          onError("ファイルの読み込み結果が不正です。");
          return;
        }

        void Promise.resolve(onFile(decodeText(reader.result))).catch((error) => {
          onError(error instanceof Error ? error.message : "ファイルの読み込み後の処理に失敗しました。");
        });
      } catch (error) {
        onError(error instanceof Error ? error.message : "ファイルの読み込みに失敗しました。");
      }
    };

    reader.onerror = () => onError("ファイルの読み込みに失敗しました。");
    reader.readAsArrayBuffer(file);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    const date = new Date(iso);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <label
      htmlFor={inputId}
      className="border-2 border-dashed rounded-xl p-4 flex flex-col gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      style={{ borderColor: isLoaded ? "#16a34a" : "#d1d5db" }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex items-center gap-2">
        <span className="text-lg">{isLoaded ? "OK" : "📁"}</span>
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
    </label>
  );
}
