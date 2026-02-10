import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gray: {
          750: '#2d3748',
          850: '#1a202c',
          950: '#0a0e1a',
        },
        fl: {
          panel: {
            DEFAULT: '#1a1a1a',
            dark: '#111111',
            medium: '#252525',
            light: '#2e2e2e',
          },
          accent: {
            orange: '#ff6b00',
            amber: '#f5a623',
          },
          lcd: {
            bg: '#0a0f0a',
            border: '#1a2a1a',
            text: '#00ff00',
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;

