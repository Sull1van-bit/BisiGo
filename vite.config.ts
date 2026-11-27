import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createRoboflowMiddleware } from './api/detect';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const detectMiddleware = createRoboflowMiddleware({
    ROBOFLOW_API_KEY: env.ROBOFLOW_API_KEY,
    ROBOFLOW_API_URL: env.ROBOFLOW_API_URL,
  });

  return {
    plugins: [
      react(),
      {
        name: 'bisigo-roboflow-proxy',
        configureServer(server) {
          server.middlewares.use('/api/detect', detectMiddleware);
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/detect', detectMiddleware);
        },
      },
    ],
    server: {
      port: 3000,
      host: true,
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion'],
          },
        },
      },
    },
  };
});
