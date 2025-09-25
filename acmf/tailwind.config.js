/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,ts}"],
    theme: {
      extend: {
        keyframes: {
          fadeIn: {
            '0%': { opacity: 0, transform: 'translateY(10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        },
        animation: {
          fadeIn: 'fadeIn 0.4s ease-out',
        },
      },
    },
    keyframes: {
      fadeIn: {
        "0%": { opacity: 0, transform: "translateY(-4px)" },
        "100%": { opacity: 1, transform: "translateY(0)" },
      },
    },
    animation: {
      "fade-in": "fadeIn 0.15s ease-out",
    },
    plugins: [],
  }
  
  