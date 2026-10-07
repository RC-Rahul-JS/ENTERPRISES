import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { DOMAIN } from './src/config/api.js';

const HOST = DOMAIN.replace(/^https?:\/\//, '').split(':')[0] || 'localhost';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      HOST,
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/badri_enterprises': {
        target: DOMAIN,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
