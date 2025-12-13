/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './resources/**/*.blade.php',
        './resources/**/*.html',
        './resources/**/*.js',
        './resources/**/*.vue',
        './public/**/*.html',
        './public/**/*.js',
        './app/Http/**/*.php'
    ],
    theme: {
        extend: {
            colors: {
                primary: '#003A5D',
                secondary: '#1A1A1A',
                accent: '#0BBF78'
            }
        }
    },
    plugins: []
};
