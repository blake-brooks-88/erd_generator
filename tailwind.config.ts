import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      containers: {
        'sm': '(max-width: 400px)',
      },
      borderRadius: {
        lg: ".5625rem", /* 9px */
        md: ".375rem", /* 6px */
        sm: ".1875rem", /* 3px */
      },
      colors: {
        // --- Custom Semantic Palette (High Contrast, Branded) ---
        'primary': '#E49A43', // Orange - Main CTA, Active State
        'primary-dark': '#BF7724', // Primary Hover
        'secondary': '#4AA0D9', // Blue - Secondary Action, Complementary
        'accent': '#BED163', // Green - Tertiary Accent, Success

        // Backgrounds & Text
        'page-bg': '#FFFFFF',    // Main application background
        'base': '#F5F5F5',       // Component/Card background for subtle contrast
        'text': '#1C2023',       // High-contrast main text
        'neutral': '#8A959C',    // Subtle text, borders, inactive elements
        'border': '#E0E0E0',     // Input and card borders (STATIC DEFINITION KEPT)

        // Status/Semantic
        'info': '#4AA0D9',    // Secondary brand color for info
        'success': '#BED163', // Accent brand color for success
        'warning': '#E49A43', // Primary brand color for warning/caution
        'error': '#D32F2F',

        // Shadcn compatibility layer (adjusted to remove border conflict)
        background: "var(--page-bg)",
        foreground: "var(--text)",
        input: "var(--border)", // Uses the static 'border' definition
        card: {
          DEFAULT: "var(--base)",
          foreground: "var(--text)",
          border: "var(--border)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "var(--border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--border)",
        },
        destructive: {
          DEFAULT: "var(--error)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--border)",
        },
        ring: "var(--primary)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)"
        },
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        // NEW: Subtle hover/focus pulse for clean interactivity
        'pulse-hover': {
          '0%, 100%': { transform: 'scale(1)', 'box-shadow': 'none' },
          '50%': { transform: 'scale(1.01)', 'box-shadow': '0 4px 6px rgba(0, 0, 0, 0.05)' },
        },
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
        'pulse-hover': 'pulse-hover 0.5s ease-in-out',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;