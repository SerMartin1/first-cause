// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import prettier from "eslint-config-prettier";
import globals from "globals";

/**
 * Architecture boundaries (Implementation Roadmap SS9 / Canonical
 * Decisions): Simulation Core, content and shared code must never
 * import React or Electron, and must never reach into the desktop app.
 */
const simulationCoreBoundaryRules = {
  "no-restricted-imports": [
    "error",
    {
      paths: [
        {
          name: "react",
          message: "Simulation Core must not depend on React.",
        },
        {
          name: "react-dom",
          message: "Simulation Core must not depend on React.",
        },
        {
          name: "electron",
          message: "Simulation Core must not depend on Electron.",
        },
      ],
      patterns: [
        {
          group: ["**/apps/desktop/**", "@first-cause/desktop*"],
          message: "Simulation Core must not depend on the desktop app / UI.",
        },
      ],
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/out/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/*.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  // Simulation Core / content / shared: never import UI or Electron.
  {
    files: [
      "packages/simulation/**/*.ts",
      "packages/content/**/*.ts",
      "packages/shared/**/*.ts",
    ],
    rules: simulationCoreBoundaryRules,
  },
  // Deterministic Core (M1, SAVE-004): no uncontrolled randomness or
  // system time as a source of truth. Everything goes through the
  // seeded, named-stream RNG (core/rng.ts) and the tick-derived clock
  // (core/time.ts) instead.
  {
    files: ["packages/simulation/src/core/**/*.ts"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message:
            "Simulation Core must not use Math.random() -- use a named RNG stream from core/rng.ts (SAVE-004).",
        },
        {
          object: "Date",
          property: "now",
          message:
            "Simulation Core must not read system time -- derive dates from the tick via core/time.ts (SAVE-004).",
        },
        {
          object: "crypto",
          property: "randomUUID",
          message:
            "Simulation Core must not use non-deterministic UUIDs -- use core/ids.ts::createIdGenerator (SAVE-004).",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date']",
          message:
            "Simulation Core must not read system time via `new Date()` -- derive dates from the tick via core/time.ts (SAVE-004).",
        },
      ],
    },
  },
  // Plain Node packages: Node globals, no browser globals.
  {
    files: ["packages/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
  // Electron main/preload: Node + Electron runtime, CommonJS-ish globals.
  {
    files: ["apps/desktop/electron/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
  // React renderer.
  {
    files: ["apps/desktop/src/**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: { globals: { ...globals.browser } },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
  // Root/tooling config files.
  {
    files: [
      "*.config.ts",
      "*.config.js",
      "vitest.setup.ts",
      "tests/**/*.ts",
      "apps/desktop/electron.vite.config.ts",
    ],
    languageOptions: { globals: { ...globals.node } },
  },
  prettier,
);
