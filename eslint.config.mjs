import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  {
    ignores: [
      ".test-build/**",
      "documentation/**",
      "examples/**",
      "node_modules/**",
      "release/**",
      "tests/**",
    ],
  },
  ...obsidianmd.configs.recommended,
  {
    files: ["package.json"],
    rules: {
      "obsidianmd/no-plugin-as-component": "off",
    },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
