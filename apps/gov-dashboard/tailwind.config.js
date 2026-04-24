const preset = require("@educai/ui/tailwind-preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
};
