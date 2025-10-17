/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',               // ⬅️ important
  content: [
    './apps/**/*.{html,ts}',
    './libs/**/*.{html,ts}',
  ],
  theme: { extend: {} },
  plugins: [],
};
