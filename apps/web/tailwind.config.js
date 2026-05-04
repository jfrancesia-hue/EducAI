import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const preset = require("@educai/ui/tailwind-preset");

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [preset],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
};

export default config;
