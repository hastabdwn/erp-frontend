import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // target: 'http://localhost:3000',
        target: 'https://erp-backend-v1.up.railway.app',
        changeOrigin: true,
      }
    }
  }
})
