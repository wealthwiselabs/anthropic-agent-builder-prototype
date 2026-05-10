import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path is set for GitHub Pages subpath hosting at /anthropic-agent-builder-prototype/.
// In dev (npm run dev) base resolves to '/'.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/anthropic-agent-builder-prototype/' : '/',
}));
