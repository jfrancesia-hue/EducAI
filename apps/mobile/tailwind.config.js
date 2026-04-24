/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        apoyoai: {
          50: "#EEF2FF",
          500: "#6366F1",
          600: "#4F46E5",
        },
      },
    },
  },
};
