/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dispensary: {
          bg: '#f0faf4',        // Pale sage / mint background from UI
          card: '#ffffff',      // Pure white card
          surface: '#eaf5ee',   // Light mint input / pill surface
          border: '#d6e8dd',    // Subtle sage border
          accent: '#0a2e1e',    // Deep apothecary forest green
          accentHover: '#072417',
          mintBadge: '#dcfce7', // Light badge background
          darkText: '#0a2e1e',  // Primary dark forest text
          mutedText: '#4b6356', // Secondary muted green-gray
          lightGray: '#cccccc', // Placeholder logo box
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Cinzel"', '"Cormorant Garamond"', 'serif'],
      }
    },
  },
  plugins: [],
}
