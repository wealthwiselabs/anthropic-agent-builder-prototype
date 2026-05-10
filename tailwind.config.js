/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Tiempos Headline"', '"EB Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        canvas: '#F7F5F0',
        chrome: '#FAFAF7',
        border: '#E8E5DD',
        ink: '#1F1E1B',
        muted: '#6B6862',
        coral: '#D97757',
        node: {
          agent: '#EDF1FA',
          subagent: '#F2EEFB',
          start: '#E8F3EB',
          end: '#E8F3EB',
          classify: '#FCEFD5',
          ifelse: '#FCEFD5',
          while: '#FCEFD5',
          approval: '#FCEFD5',
          tool: '#F4ECE0',
          memory: '#F4ECE0',
          guardrails: '#F4ECE0',
          mcp: '#F4ECE0',
          skill: '#EFEFEF',
          note: '#FFF8DD',
        },
      },
      boxShadow: {
        node: '0 1px 2px rgba(31, 30, 27, 0.05), 0 0 0 1px rgba(31, 30, 27, 0.06)',
        'node-selected': '0 0 0 2px #D97757, 0 1px 3px rgba(217, 119, 87, 0.2)',
      },
    },
  },
  plugins: [],
};
