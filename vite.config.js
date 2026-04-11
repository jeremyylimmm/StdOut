import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Make REACT_APP_API_URL available as environment variable in the app
    'import.meta.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL)
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})