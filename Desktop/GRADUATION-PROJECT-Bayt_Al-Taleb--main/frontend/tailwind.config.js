/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "up-down": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
      animation: {
        "up-down": "up-down 3s ease-in-out infinite",
      },
      backgroundImage: {
        hero: "linear-gradient(90deg,rgba(1, 5, 103, 1) 0%, rgba(47, 24, 75, 1) 100%)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        bgSection: "hsl(var(--bgSection))",
        bgDark: "hsl(var(--bgDark))",
        // primary: "hsl(var(--primary))",
        paragraph: "hsl(var(--paragraph))",

        // accent: "hsl(var(--accent))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          // foreground: "hsl(var(--primary-foreground))",
        },
        primaryLight: "hsl(235, 66%, 30%)",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          // foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          // foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          // foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          // foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
