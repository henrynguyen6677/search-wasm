
[RipGrep-Lite-WASM.webm](https://github.com/user-attachments/assets/2787ef5c-cbec-4d06-9ee2-5097ebc4467f)

# RipGrep-Lite WASM

A high-performance regex search tool built with Rust (compiled to WebAssembly) and modern web technologies.

## 🏗️ Project Structure

```
├── src/                    # 🦀 Rust source code  
│   ├── lib.rs             # Main Rust library
│   └── utils.rs           # Utilities
├── frontend/              # 🌐 Complete Vite frontend project
│   ├── index.html         # Entry point
│   ├── main.js           # Application logic  
│   ├── worker.js         # Web Worker for parallel processing
│   ├── style.css         # TailwindCSS styles
│   └── *.config.js       # Build configurations
├── pkg/                   # 📦 Generated WASM files
└── tests/                 # 🧪 Rust tests
```

## 🚀 Development

### Rust (WASM)
```bash
# Build Rust to WASM
cargo build
wasm-pack build --target web --out-dir pkg
```

### Frontend
```bash
cd frontend/
npm install
npm run dev     # Development server
npm run build   # Production build
```

## ⚡ Features

- **High Performance**: Rust-powered regex search via WebAssembly
- **Parallel Processing**: Multi-threaded file processing with Web Workers  
- **Modern UI**: TailwindCSS with responsive design
- **Fast Development**: Vite with HMR and modern tooling

Built with Rust 🦀 + Vite ⚡ + WebAssembly 🚀
