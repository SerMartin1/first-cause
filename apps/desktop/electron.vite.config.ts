import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

// @first-cause/shared ships as an ESM package (package.json "type":
// "module"). electron-vite's default externalizeDepsPlugin() would leave
// it as a runtime `require("@first-cause/shared")` in the CJS main/
// preload bundles, which crashes with ERR_REQUIRE_ESM. Excluding it here
// makes esbuild inline it at build time instead -- no runtime ESM/CJS
// interop problem, and no source duplication risk since it is types +
// a handful of string constants.
const workspaceEsmPackages = [
  "@first-cause/shared",
  "@first-cause/worldgen",
  "@first-cause/simulation",
  "@first-cause/entities",
  "@first-cause/content",
  "@first-cause/causality",
  "@first-cause/chronicle",
];

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: workspaceEsmPackages })],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "electron/main/index.ts"),
          "world-worker": resolve(__dirname, "electron/main/world-worker.ts"),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: workspaceEsmPackages })],
    build: {
      rollupOptions: {
        input: resolve(__dirname, "electron/preload/index.ts"),
      },
    },
  },
  renderer: {
    root: ".",
    plugins: [react()],
    build: {
      rollupOptions: {
        input: resolve(__dirname, "index.html"),
      },
    },
  },
});
