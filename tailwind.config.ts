import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
      },
      colors: {
        gold: { DEFAULT: "#c9a227", light: "#f0d47a" },
        ink: "#07070b",
        surface: "#101018",
        surface2: "#17171f",
      },
    },
  },
  plugins: [],
};
export default config;
