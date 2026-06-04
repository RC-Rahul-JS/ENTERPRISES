import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    allowedHosts: [
      "hyphen-chemo-exponent.ngrok-free.dev", // 👈 Add your ngrok host here
    ],
  },
})
