import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Single root Vitest config for the whole monorepo (M0 scope).
 *
 * Packages (`packages/**`) are plain Node/TS -- they run in the "node"
 * environment. The desktop renderer (`apps/desktop/src`) needs a DOM,
 * so it is switched to "jsdom" via `environmentMatchGlobs`.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    include: ["packages/**/src/**/*.test.ts", "apps/desktop/src/**/*.test.tsx"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/out/**"],
    environment: "node",
    environmentMatchGlobs: [["apps/desktop/**", "jsdom"]],
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    restoreMocks: true,
  },
});
