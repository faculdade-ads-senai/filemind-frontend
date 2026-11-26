import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: caminho => caminho.replace(/^\/api/, ''),
      },
      '/rag': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: caminho => caminho.replace(/^\/rag/, ''),
      },
    },
  },
})
