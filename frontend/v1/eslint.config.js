import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // shadcn/ui + theme-provider + hooks come from upstream templates that
  // intentionally export non-component helpers alongside the components,
  // and use patterns flagged by the new react-hooks ruleset. We treat
  // these files as vendored code and relax the strict rules so they
  // don't block builds.
  {
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/components/theme-provider.tsx",
      "src/hooks/**/*.{ts,tsx}",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
]);
