import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["node_modules/**", ".next/**", "dist/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Use the base TS config to avoid requiring full type info
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        process: "readonly",
        module: "readonly",
        window: "readonly",
        document: "readonly",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      // Relax Next.js image rule for now
      "@next/next/no-img-element": "off",
      // Avoid type-aware rules that require project references
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
  ,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        process: "readonly",
        module: "readonly",
        __dirname: "readonly",
      },
    },
    rules: {
      // Keep JS simple for config files
    },
  }
);
