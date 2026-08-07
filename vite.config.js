import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: this must match your GitHub repo name exactly.
export default defineConfig({
    plugins: [react()],
    base: '/Impi-digital-cards/'
})
