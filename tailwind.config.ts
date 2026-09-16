import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0b1220",
        brand: {
          DEFAULT: "#2563eb",
          dark: "#1d4ed8",
        },
        gold: "#d4af37",
      },
    },
  },
  plugins: [],
};
export default config;
