/** @format */

// eslint.config.mjs
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    { ignores: ['dist'] },
    // 通用 JS / TS 設定
    {
        files: ["**/*.{js,mjs,cjs,ts}"],
        plugins: { js }, // --> 使用 ESLint 官方內建的 JavaScript plugin
        extends: ["js/recommended"], // --> 套用官方 JS 標準建議規則
        languageOptions: {
            globals: {
                ...globals.browser, // --> 提供 node 和 Browser 等全域變數使用(例: window, document)
            },
        },
    },

    // JS 檔案使用 CommonJS 模式
    {
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "commonjs", // --> 明確定義 JS 檔案使用 CommonJS（如 require）
        },
    },

    // TypeScript 設定
    tseslint.configs.recommended, // --> 使用 TypeScript 的 ESLint 規則
]);
