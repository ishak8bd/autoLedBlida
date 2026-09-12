/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#09090c",
          surface: "#121217",
          card: "#17171e",
          cardHover: "#1f1f28",
          border: "#262633",
          borderLight: "#37374a",
          red: "#e60026",
          redLight: "#ff2a4b",
          redDark: "#a8001a",
          neon: "#ff1744",
          blue: "#38bdf8",
          gold: "#fbbf24"
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
        arabic: ["Cairo", "Tajawal", "system-ui", "sans-serif"]
      },
      boxShadow: {
        "glow-red": "0 0 25px -5px rgba(230, 0, 38, 0.5), 0 0 10px -2px rgba(230, 0, 38, 0.3)",
        "glow-red-lg": "0 0 45px -5px rgba(230, 0, 38, 0.7), 0 0 20px -2px rgba(230, 0, 38, 0.5)",
        "glow-blue": "0 0 25px -5px rgba(56, 189, 248, 0.5)",
        "card": "0 10px 30px -10px rgba(0, 0, 0, 0.7)"
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "beam-glow": "beamGlow 2s ease-in-out infinite alternate"
      },
      keyframes: {
        beamGlow: {
          "0%": { opacity: "0.8", filter: "drop-shadow(0 0 15px rgba(230,0,38,0.6))" },
          "100%": { opacity: "1", filter: "drop-shadow(0 0 30px rgba(255,42,75,0.9))" }
        }
      }
    },
  },
  plugins: [],
}