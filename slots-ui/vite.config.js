import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Viktig: base må matche repo-navnet ditt på GitHub
export default defineConfig({
  plugins: [react()],
  base: '/Slots/',
})
