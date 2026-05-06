/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: '#0f172a',
                    light: '#f1f5f9',
                    accent: '#2563eb'
                }
            }
        },
    },
    plugins: [],
}