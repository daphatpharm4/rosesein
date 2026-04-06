import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8f9fa",
        surface: "#f8f9fa",
        "surface-container": "#ebeef0",
        "surface-container-low": "#f1f4f5",
        "surface-container-high": "#e5e9eb",
        "surface-container-lowest": "#ffffff",
        "surface-container-highest": "#dee3e6",
        "surface-tint": "#b2254f",
        primary: "#b2254f",
        "primary-container": "#fc5e84",
        "primary-fixed-dim": "#eb5178",
        secondary: "#576068",
        "secondary-container": "#dbe4ed",
        tertiary: "#8a4d5b",
        "on-surface": "#2d3335",
        "on-surface-variant": "#5a6062",
        "on-primary": "#fff7f7",
        "on-primary-container": "#370011",
        "on-secondary-container": "#4a535a",
        outline: "#767c7e",
        "outline-variant": "#adb3b5",
      },
      fontFamily: {
        headline: ["var(--font-plus-jakarta-sans)", "sans-serif"],
        body: ["var(--font-be-vietnam-pro)", "sans-serif"],
        label: ["var(--font-plus-jakarta-sans)", "sans-serif"],
      },
      borderRadius: {
        brand: "1rem",
        "brand-md": "1.5rem",
        "brand-xl": "3rem",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #b2254f 0%, #fc5e84 100%)",
      },
      boxShadow: {
        ambient: "0 8px 24px rgba(45, 51, 53, 0.04)",
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
