#!/usr/bin/env bash

# Build script for Cloudflare Pages deployment
set -euo pipefail

echo "🔍 Current directory: $(pwd)"
echo "📁 Contents: $(ls -la)"

echo "🦀 Building Rust to WASM..."
# Check if wasm-pack exists
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

wasm-pack build --target web --out-dir pkg

echo "🌐 Building Frontend..."
cd frontend
npm ci
npm run build

echo "📦 Copying WASM files to dist..."
cd ..
mkdir -p dist/assets
cp -r pkg/* dist/assets/ 2>/dev/null || true

echo "📄 Copying headers for Cloudflare..."
cp frontend/_headers dist/ 2>/dev/null || echo "No _headers file found"

echo "🔧 Updating import paths for production..."
# Update worker.js to use correct WASM path
find dist/assets -name "*.js" -exec sed -i.bak 's|../pkg/ripgrep_lite_wasm.js|./assets/ripgrep_lite_wasm.js|g' {} \; 2>/dev/null || true

echo "✅ Build completed! Ready for Cloudflare Pages deployment."
echo "📁 Output directory: dist/"
echo "📋 Contents:"
ls -la dist/ || true 