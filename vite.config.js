import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/project_hamer/',
  define: {
    __GOLF_API_KEY__: JSON.stringify('MWE6BSAFMGCRSR6RSESW5DOHMU'),
  },
})
