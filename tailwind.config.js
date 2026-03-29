/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Mapped from src/constants/colors.ts
        background: "#1C1C1E",
        card: "#2C2C2E",
        "card-elevated": "#3A3A3C",
        divider: "#3C3C3E",
        border: "#2C2C2E",
        primary: "#0D9488",
        "primary-dark": "#1A6B60",
        "primary-dim": "#1A4A48",
        "text-primary": "#FFFFFF",
        "text-secondary": "#CCCCCC",
        "text-muted": "#888888",
        "text-disabled": "#555558",
        correct: "#22C55E",
        wrong: "#DC2626",
        warning: "#F59E0B",
        "star-red": "#EF4444",
        tone1: "#EF4444",
        tone2: "#F97316",
        tone3: "#22C55E",
        tone4: "#3B82F6",
        toneN: "#888888",
        hsk1: "#1F7A4A",
        hsk2: "#4A7A1F",
        hsk3: "#7A6A10",
        hsk4: "#7A3A10",
        hsk5: "#7A1010",
        hsk6: "#501010",
        hsk79: "#404040",
      },
    },
  },
  plugins: [],
};
