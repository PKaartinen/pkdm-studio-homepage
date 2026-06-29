import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep near-black foundation — matches the live site (#000206)
        ink: {
          950: "#000206",
          900: "#03060e",
          800: "#070c1a",
          700: "#0c1430",
          600: "#111e44",
        },
        accent: {
          // Signature electric cyan + brand blue gradient stops
          DEFAULT: "#69edfe",
          soft: "#a6f4ff",
          deep: "#0167b4",
          glow: "#1f9fd6",
        },
        haze: "#8fa1b8",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        shell: "1240px",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee var(--marquee-duration, 40s) linear infinite",
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
