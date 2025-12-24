import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // <--- Changed from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['171.244.142.99.sslip.io'],   
    host: true, // Allows mobile connection
    port: 5173
  }
})
