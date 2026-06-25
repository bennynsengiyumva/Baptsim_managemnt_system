/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e40af",
        secondary: "#64748b",
        accent: "#0891b2",
        success: "#16a34a",
        warning: "#ea580c",
        error: "#dc2626",
        background: "#f8fafc",
        surface: "#ffffff",
        foreground: "#0f172a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
