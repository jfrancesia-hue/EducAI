import base from "@educai/config/eslint/base";

export default [
  {
    ignores: [
      ".next/**",
      "next-env.d.ts",
      "eslint.config.mjs",
      "next.config.mjs",
      "postcss.config.js",
      "tailwind.config.js",
    ],
  },
  ...base,
];
