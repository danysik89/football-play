import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; set BASE_PATH in CI.
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  server: { host: true },
});
