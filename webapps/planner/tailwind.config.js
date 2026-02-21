/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        planner: {
          bg: '#f3f4f6',      // gray-100
          surface: '#ffffff', // white
          primary: '#2563eb', // blue-600
          text: '#111827',    // gray-900
          textMuted: '#6b7280', // gray-500
          border: '#e5e7eb',  // gray-200
        }
      }
    },
  },
  plugins: [],
}
