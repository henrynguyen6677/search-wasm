#!/bin/bash

# Script để chuyển đổi sang Vite version
echo "🚀 Switching to Vite version..."

# Backup original files if needed
if [ ! -f "www/index.html.backup" ]; then
    echo "📦 Backing up original files..."
    cp www/index.html www/index.html.backup
    cp www/index.js www/index.js.backup
    cp www/worker.js www/worker.js.backup
fi

# Ensure WASM files are in public
echo "📁 Ensuring WASM files are in public directory..."
mkdir -p public/pkg
cp -r www/pkg/* public/pkg/

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Vite dependencies..."
    npm install
fi

echo "✅ Vite version is ready!"
echo ""
echo "📖 Usage:"
echo "  npm run dev     - Start development server"
echo "  npm run build   - Build for production"
echo "  npm run preview - Preview production build"
echo ""
echo "🌐 The new structure uses:"
echo "  - index.html (root level)"
echo "  - src/ (🦀 Rust code ONLY - lib.rs, utils.rs)"
echo "  - frontend/ (🌐 Frontend code - main.js, worker.js, style.css)"
echo "  - public/pkg/ (WASM files)"
echo ""
echo "🧹 Clean separation achieved:"
echo "  ✅ No more mixed .js and .rs files"
echo "  ✅ Rust compiler only processes src/"
echo "  ✅ Vite only processes frontend/ and public/" 