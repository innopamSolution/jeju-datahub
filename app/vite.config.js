import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/jeju-datahub/' : '/',
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5183,
  },
}))
