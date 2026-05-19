/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}",],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {

      colors: {
        'border' : '#e2c8b2',
        'bg' : '#fbfaf6',
        'success' : '#198754',
        'warning' : '#ffc107',
        'danger' : '#dc3545',
        'info' : '#0dcaf0',
      },

      fontFamily: {
        'Nunito-Black': ['Nunito-Black'],
        'Nunito-Bold': ['Nunito-Bold'],
        'Nunito-ExtraBold': ['Nunito-ExtraBold'],
        'Nunito-Light': ['Nunito-Light'],
        'Nunito-Medium': ['Nunito-Medium'],
        'Nunito-Regular': ['Nunito-Regular'],
        'Nunito-SemiBold': ['Nunito-SemiBold'],
      }
    },
  },
  plugins: [],
}