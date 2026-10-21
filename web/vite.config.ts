import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// BASE_PATH задаётся в CI для GitHub Pages (/kwork-club-miniapp/), локально — корень.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
