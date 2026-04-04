/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "'Plus Jakarta Sans'",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        jakarta: [
          "'Plus Jakarta Sans'",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
        // Dark theme tokens
        dark: {
          bg: "#0a0e1a",
          card: "#141824",
          elevated: "#1e2538",
          text: "#f0f4ff",
          muted: "#6b7a99",
        },
        // Light theme tokens
        light: {
          bg: "#f8f9fc",
          card: "#ffffff",
          elevated: "#f0f3f9",
          border: "#e2e8f0",
          text: "#0f172a",
          muted: "#64748b",
        },
        // Brand accents
        brand: {
          green: "#00e87a",
          "green-dk": "#00b85f",
          cyan: "#00c8ff",
          orange: "#ff6b35",
          danger: "#ff4757",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
    },
  },
  plugins: [],
};
