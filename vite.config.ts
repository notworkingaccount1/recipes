import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps the build working on any path (user.github.io/repo/, a custom domain, etc.)
export default defineConfig({
  base: './',
  plugins: [react()]
});
