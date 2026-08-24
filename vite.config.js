import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      "https://api.care2connect.in",
    ],
    proxy: {
      '/badri_enterprises': {
        target: 'https://api.care2connect.in',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
