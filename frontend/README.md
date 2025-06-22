# RipGrep-Lite Frontend

🌐 **Complete Vite Frontend Project** cho RipGrep-Lite WASM Application

## 🏗️ **Project Structure**

```
frontend/
├── 📄 HTML & JS
│   ├── index.html          # Entry point
│   ├── main.js            # Main application logic
│   └── worker.js          # Web Worker for parallel processing
├── 🎨 STYLING
│   └── style.css          # TailwindCSS styles
├── ⚙️ CONFIG
│   ├── package.json       # Dependencies
│   ├── vite.config.js     # Vite configuration
│   ├── tailwind.config.js # TailwindCSS config
│   └── postcss.config.js  # PostCSS config
└── 🔧 SCRIPTS
    └── scripts/
        └── switch-to-vite.sh
```

## 🚀 **Quick Start**

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📦 **Build Output**

Build output sẽ được tạo trong `../dist/` directory (ngoài frontend folder) để tránh cluttering frontend workspace.

## 🔗 **Dependencies**

This frontend project imports WASM từ `../pkg/ripgrep_lite_wasm.js` - được compile từ Rust code trong `../src/`.

## 🎯 **Key Features**

- ⚡ **Vite**: Fast development với HMR
- 🎨 **TailwindCSS**: Utility-first CSS framework
- 🧵 **Web Workers**: Parallel file processing
- 📦 **WASM Integration**: High-performance search via Rust
- 📱 **Responsive**: Modern, mobile-friendly UI

## 🔧 **Development**

```bash
# Start dev server
npm run dev
# Server runs on http://localhost:5173

# Build for production
npm run build
# Output in ../dist/

# Preview production build
npm run preview
```

## 🌐 **Completely Self-Contained**

Đây là một **complete frontend project** với tất cả dependencies và config riêng, hoàn toàn tách biệt khỏi Rust project ở root level. 