import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/portal/',
  plugins: [react()],
  build: {
    outDir: '../portal-dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/data': 'http://localhost:8788',
    },
  },
})
