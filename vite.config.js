import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  // For GitHub Pages — set to '/<repo-name>/' after creating the repo
  // e.g. base: '/dsa-reviser/'
  // Leave as '/' for custom domains or local dev
  base: './',
})
