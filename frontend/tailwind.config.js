/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          light: '#fdfaff', // Very light purple tint
          purple: '#4c1d95', // Dark Purple (violet-900)
          dark: '#0f071a',   // Almost black purple
          accent: '#7c3aed', // Vibrant purple
        }
      },
      boxShadow: {
        'elegant': '0 4px 20px -2px rgba(76, 29, 149, 0.05), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
