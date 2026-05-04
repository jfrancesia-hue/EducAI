import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
      "**/eslint.config.mjs",
      "**/next-env.d.ts",
      "**/next.config.mjs",
      "**/postcss.config.js",
      "**/tailwind.config.js",
      "**/babel.config.js",
      "**/metro.config.js",
      "**/*.config.cjs",
      "**/tailwind-preset.cjs"
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  }
);
