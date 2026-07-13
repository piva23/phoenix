/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:       "var(--primary)",
        secondary:     "var(--secondary)",
        accent:        "var(--accent)",
        background:    "var(--bg)",
        surface:       "var(--bg-surface)",
        "surface-2":   "var(--bg-surface-2)",
        "pure-white":  "var(--bg-pure-white)",
        "text-main":   "var(--text-main)",
        "text-muted":  "var(--text-muted)",
        "text-dim":    "var(--text-dim)",
        border:        "var(--border)",
        "border-strong":"var(--border-strong)",
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { DEFAULT: 'var(--radius)', sm: 'var(--radius-sm)', lg: 'var(--radius-lg)' },
    },
  },
  plugins: [],
}
