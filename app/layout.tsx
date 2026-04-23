import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "出来高算出ダッシュボード",
  description: "全体工程表・進捗ダッシュボードのデータから出来高を算出するダッシュボード",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
