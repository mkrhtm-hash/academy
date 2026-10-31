import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // /api is served by server/dev-api.js locally and by Vercel functions in production.
    proxy: { '/api': `http://localhost:${process.env.API_PORT || 3001}` },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          recharts: ['recharts'],
          lwc: ['lightweight-charts'],
        },
      },
    },
  },
})
