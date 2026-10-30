import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink:    { DEFAULT: "#080B16", 2: "#0E1424", 3: "#162035", 4: "#1F2B48" },
        paper:  "#F7F8FC",
        lime:   { DEFAULT: "#C6F24E", deep: "#9BD32B", soft: "#1A2510" },
        sky:    { DEFAULT: "#5B8CFF", soft: "#101A3A" },
        violet: { DEFAULT: "#A78BFA", soft: "#1A1235" },
        amber:  { DEFAULT: "#FBBF24", soft: "#2A1E05" },
        rose:   { DEFAULT: "#F472B6", soft: "#2A0F1E" },
        muted:  "#8A93A8",
        line:   "#232E4A",
        danger: "#FF6B6B",
        ok:     "#3DDC97",
      },
      fontFamily: { sans: ["Vazirmatn", "system-ui", "sans-serif"] },
      borderRadius: { xl2: "1.25rem", xl3: "1.75rem", xl4: "2.25rem" },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "pulse-soft": { "0%, 100%": { opacity: "1" }, "50%": { opacity: ".5" } },
        "orbit": { to: { transform: "rotate(360deg)" } },
        "float": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        "shimmer": { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "fade-up": "fade-up .6s ease forwards",
        "spin-slow": "spin-slow 24s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "orbit": "orbit 30s linear infinite",
        "float": "float 4s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite",
      },
      backgroundImage: {
        "mesh": "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(198,242,78,.10), transparent 60%), radial-gradient(ellipse 70% 50% at 80% 10%, rgba(167,139,250,.12), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(91,140,255,.08), transparent 60%)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
} satisfies Config;