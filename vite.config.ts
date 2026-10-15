import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// npm run dev: Vite di 5173, API diteruskan ke server Node (npm start) di 8080.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://localhost:8080' } },
  build: { sourcemap: false, chunkSizeWarningLimit: 600 },
});
