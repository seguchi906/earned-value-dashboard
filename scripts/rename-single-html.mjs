import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "single-html");
const source = path.join(outDir, "index.html");
const target = path.join(outDir, "earned-value-dashboard.html");

if (!fs.existsSync(source)) {
  throw new Error("single-html/index.html が見つかりません。vite build の出力を確認してください。");
}

if (fs.existsSync(target)) {
  fs.rmSync(target);
}

fs.renameSync(source, target);
console.log(`Created ${target}`);
