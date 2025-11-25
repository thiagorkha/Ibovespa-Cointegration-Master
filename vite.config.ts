import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo (development/production)
  // O terceiro argumento '' garante que carregue todas as variáveis, não apenas as com prefixo VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    define: {
      // Isso substitui 'process.env.API_KEY' pelo valor real da string durante o build
      // Soluciona o erro "process is not defined" no navegador
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    },
    server: {
      port: 3000,
    }
  };
});