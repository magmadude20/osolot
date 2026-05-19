// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.wrangler/**",
      "**/android/**",
      "**/ios/**",
      "**/build/**",
      "**/.expo/**",
      "**/*.config.js",
      "**/metro.config.js",
      "**/babel.config.js",
      "apps/mobile/index.js",
      "workers/osolot-api/supabase-types/generated-types.d.ts",
    ],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts", "packages/shared/vitest.config.ts"],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
