#!/bin/bash

# Build script for Cloudflare Pages deployment
set -e

echo "🦀 Building Rust to WASM..."
wasm-pack build --target web --out-dir pkg

echo "🌐 Building Frontend..."
cd frontend
npm ci
npm run build

echo "📦 Copying WASM files to dist..."
cd ..
cp -r pkg/* dist/assets/ 2>/dev/null || mkdir -p dist/assets && cp -r pkg/* dist/assets/

echo "📄 Copying headers for Cloudflare..."
cp frontend/_headers dist/ 2>/dev/null || echo "No _headers file found"

echo "🔧 Updating import paths for production..."
# Update worker.js to use correct WASM path
sed -i.bak 's|../pkg/ripgrep_lite_wasm.js|./assets/ripgrep_lite_wasm.js|g' dist/assets/*.js 2>/dev/null || true

echo "✅ Build completed! Ready for Cloudflare Pages deployment."
echo "📁 Output directory: dist/"
echo "📋 Contents:"
ls -la dist/ 