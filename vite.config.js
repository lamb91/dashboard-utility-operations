import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/dashboard-utility-operations/',
  server: {
    headers: {
      'X-Frame-Options': '',
      'Content-Security-Policy': '',
    }
  }
})
