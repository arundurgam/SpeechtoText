import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ Proper backend proxy setup
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // backend runs on this port locally
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: '../server/client', // output build to server folder for deployment
    emptyOutDir: true,
  },
});
