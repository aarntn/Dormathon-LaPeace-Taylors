import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 4173 },
});
