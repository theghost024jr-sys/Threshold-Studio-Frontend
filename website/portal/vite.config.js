import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  base: '/portal/',
  plugins: [react()],
  resolve: {
    alias: {
      'react-router-dom': resolve(import.meta.dirname, 'node_modules/react-router-dom'),
      'react/jsx-runtime': resolve(import.meta.dirname, 'node_modules/react/jsx-runtime.js'),
      'react': resolve(import.meta.dirname, 'node_modules/react'),
    },
  },
  build: {
    outDir: '../portal-dist',
    emptyOutDir: true,
  },
  server: {
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/data': 'http://localhost:8788',
    },
  },
})
