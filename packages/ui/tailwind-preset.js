/**
 * Tailwind preset compartido de EducAI.
 * Extiende esto en cada app: `presets: [require('@educai/ui/tailwind-preset')]`.
 * Tokens alineados con .stitch/DESIGN.md (2 identidades: ApoyoAI + EducAI).
 */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // ApoyoAI (consumer B2C — calido)
        apoyoai: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          900: "#312E81",
        },
        amber: {
          500: "#F59E0B",
        },
        coral: {
          400: "#FB7185",
        },
        // EducAI (institucional B2B/B2G — confianza)
        educai: {
          50: "#EFF6FF",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1E40AF",
          800: "#1E3A8A",
          900: "#0F172A",
        },
        teal: {
          600: "#0D9488",
        },
        // Tokens semanticos shadcn
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ["Inter Tight", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
      },
      boxShadow: {
        whisper: "0 1px 2px rgba(15,23,42,0.04), 0 1px 1px rgba(15,23,42,0.03)",
        soft: "0 4px 12px rgba(15,23,42,0.06), 0 2px 4px rgba(15,23,42,0.04)",
        float: "0 12px 32px rgba(15,23,42,0.08), 0 4px 8px rgba(15,23,42,0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
