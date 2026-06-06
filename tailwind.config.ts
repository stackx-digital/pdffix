import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: "#2E2A6E",
        danger: "#E8174B",
        ink: "#17152f",
        muted: "#6b6885",
        cloud: "#f6f7fb"
      },
      fontFamily: {
        sans: ["DM Sans", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 24px 80px rgba(46, 42, 110, 0.12)",
        line: "0 1px 0 rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
