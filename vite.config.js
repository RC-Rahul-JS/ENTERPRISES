import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      "http://192.168.29.9:5001",
    ],
    proxy: {
      '/badri_enterprises': {
        target: 'http://192.168.29.9:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
