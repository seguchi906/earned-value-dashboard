# earned-value-dashboard

Vite + React のSPA版です。サーバー起動なしで配布できる単独HTMLを生成できます。

## Development

```powershell
npm.cmd run dev
```

## Build Single HTML

```powershell
npm.cmd run build:single
```

生成先:

```text
single-html/earned-value-dashboard.html
```

このHTMLはダブルクリックで起動できます。データ保存はブラウザの IndexedDB を使用します。
