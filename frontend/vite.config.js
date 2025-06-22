import { defineConfig } from 'vite'

export default defineConfig({
  // Cấu hình để hỗ trợ WASM
  server: {
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
    emptyOutDir: true
  },
  // Optimized deps để xử lý WASM
  optimizeDeps: {
    exclude: ['../pkg/ripgrep_lite_wasm.js']
  },
  // Cấu hình WASM
  assetsInclude: ['**/*.wasm']
}) 