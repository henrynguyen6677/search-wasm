#!/usr/bin/env bash

# Build script for Cloudflare Pages deployment (Frontend only)
set -euo pipefail

echo "🔍 Current directory: $(pwd)"
echo "📁 Contents: $(ls -la)"

echo "📦 Using pre-built WASM files from pkg/"
if [ ! -d "pkg" ]; then
    echo "❌ WASM files not found! Run 'wasm-pack build --target web --out-dir pkg --release' locally first"
    exit 1
fi

echo "🌐 Building Frontend..."
cd frontend
npm ci
npm run build

echo "📦 Copying WASM files to dist..."
cd ..
mkdir -p dist/assets
cp -r pkg/* dist/assets/

echo "📄 Copying headers for Cloudflare..."
cp frontend/_headers dist/

echo "🔧 Updating import paths for production..."
# Update worker.js to use correct WASM path
find dist/assets -name "*.js" -exec sed -i.bak 's|../pkg/ripgrep_lite_wasm.js|./assets/ripgrep_lite_wasm.js|g' {} \; 2>/dev/null || true

echo "✅ Build completed! Ready for Cloudflare Pages deployment."
echo "📁 Output directory: dist/"
echo "📋 Contents:"
ls -la dist/ || true 