import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist/**", "single-html/**", "node_modules/**"]),
]);
