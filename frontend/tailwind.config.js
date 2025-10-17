/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // CRITICAL: Tells Tailwind to scan all files in your /app directory
    "./app/**/*.{js,ts,jsx,tsx}", 
    // CRITICAL: Tells Tailwind to scan all files in your /components directory
    "./components/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}