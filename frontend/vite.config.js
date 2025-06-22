import { defineConfig } from 'vite'

export default defineConfig({
  // Cấu hình để hỗ trợ WASM
  server: {
    host: '0.0.0.0',
    port: 5173,
    fs: {
      allow: ['..']
    }
  },
  // Cấu hình để hỗ trợ Web Workers
  worker: {
    format: 'es'
  },
  // Cấu hình build
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === '_headers') {
            return '_headers'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    copyPublicDir: false
  },
  // Optimized deps để xử lý WASM
  optimizeDeps: {
    exclude: ['../pkg/ripgrep_lite_wasm.js']
  },
  // Cấu hình WASM
  assetsInclude: ['**/*.wasm'],
  // Public directory để copy static files
  publicDir: '.'
}) 