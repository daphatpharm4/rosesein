import type { Config } from "tailwindcss";

const colorToken = (token: string) => `rgb(var(${token}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: colorToken("--color-background"),
        surface: colorToken("--color-surface"),
        "surface-container": colorToken("--color-surface-container"),
        "surface-container-low": colorToken("--color-surface-container-low"),
        "surface-container-high": colorToken("--color-surface-container-high"),
        "surface-container-lowest": colorToken("--color-surface-container-lowest"),
        "surface-container-highest": colorToken("--color-surface-container-highest"),
        "surface-tint": colorToken("--color-surface-tint"),
        primary: colorToken("--color-primary"),
        "primary-container": colorToken("--color-primary-container"),
        "primary-fixed-dim": colorToken("--color-primary-fixed-dim"),
        secondary: colorToken("--color-secondary"),
        "secondary-container": colorToken("--color-secondary-container"),
        tertiary: colorToken("--color-tertiary"),
        sage: colorToken("--color-sage"),
        "sage-container": colorToken("--color-sage-container"),
        "on-sage": colorToken("--color-on-sage"),
        "on-surface": colorToken("--color-on-surface"),
        "on-surface-variant": colorToken("--color-on-surface-variant"),
        "on-primary": colorToken("--color-on-primary"),
        "on-primary-container": colorToken("--color-on-primary-container"),
        "on-secondary-container": colorToken("--color-on-secondary-container"),
        outline: colorToken("--color-outline"),
        "outline-variant": colorToken("--color-outline-variant"),
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
        "gradient-primary": "var(--gradient-primary)",
      },
      boxShadow: {
        ambient: "var(--shadow-ambient)",
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
