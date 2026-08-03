import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendTarget = process.env.VITE_PROXY_TARGET || process.env.BACKEND_URL || 'http://localhost:5001';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/sidecar': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
})
