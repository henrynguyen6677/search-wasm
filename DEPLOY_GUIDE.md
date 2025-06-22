# 🚀 Cloudflare Pages Deployment Guide

## 📋 Prerequisites

1. **Cloudflare account** (free tier works)
2. **GitHub repository** (code pushed to GitHub)
3. **wasm-pack installed**: `cargo install wasm-pack`

## 🛠️ Setup Steps

### 1. Build Project Locally (Test)

```bash
# Build WASM
wasm-pack build --target web --out-dir pkg

# Build Frontend
cd frontend/
npm install
npm run build

# Check output
ls ../dist/
```

### 2. Setup Cloudflare Pages

#### Option A: GitHub Integration (Recommended)

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: add Cloudflare Pages deployment setup"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Click **Pages** → **Create a project**
   - Connect your GitHub repository
   - Select `ripgrep-lite-wasm` repository

3. **Configure Build Settings**:
   ```
   Framework preset: None
   Build command: ./build.sh
   Build output directory: dist
   Root directory: (leave empty)
   ```

4. **Environment Variables** (if needed):
   ```
   NODE_VERSION=18
   ```

#### Option B: Direct Upload

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build project
./build.sh

# Deploy
wrangler pages publish dist --project-name=ripgrep-lite-wasm
```

### 3. Custom Domain (Optional)

1. Go to your Pages project in Cloudflare Dashboard
2. Click **Custom domains** → **Set up a custom domain**
3. Enter your domain name
4. Follow DNS setup instructions

## 🔧 Build Configuration

### Build Script (`build.sh`)
```bash
#!/bin/bash
set -e

echo "🦀 Building Rust to WASM..."
wasm-pack build --target web --out-dir pkg

echo "🌐 Building Frontend..."
cd frontend
npm ci
npm run build

echo "✅ Build completed!"
```

### Cloudflare Headers (`frontend/_headers`)
- **WASM Support**: Proper MIME types for `.wasm` files
- **Caching**: Optimized cache headers for performance
- **Security**: Basic security headers

### Vite Config
- **Output**: Builds to `../dist/` for Cloudflare Pages
- **WASM**: Includes WASM files as assets
- **Headers**: Copies `_headers` file automatically

## 🚀 Deploy Process

### Automatic (GitHub)
1. Push code to GitHub
2. Cloudflare Pages automatically builds and deploys
3. Available at `https://your-project.pages.dev`

### Manual (CLI)
```bash
# Build and deploy in one command
./build.sh && wrangler pages publish dist --project-name=ripgrep-lite-wasm
```

## 🔍 Troubleshooting

### Common Issues

#### 1. **WASM Loading Error**
```
Solution: Check _headers file is deployed
Verify: Content-Type: application/wasm for *.wasm files
```

#### 2. **Build Failed - wasm-pack not found**
```bash
# Install wasm-pack
cargo install wasm-pack

# Or use alternative installation
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

#### 3. **Module Import Error**
```
Solution: Check WASM files are in correct location
Verify: Import paths in worker.js point to ../pkg/
```

### Build Logs
Check Cloudflare Pages build logs for detailed error information:
- Dashboard → Pages → Your Project → Deployments

## ⚡ Performance Tips

1. **Enable Cloudflare Features**:
   - Auto Minify (HTML, CSS, JS)
   - Brotli compression
   - HTTP/3

2. **Optimize WASM**:
   ```bash
   wasm-pack build --target web --out-dir pkg --release
   ```

3. **Cache Strategy**:
   - WASM files: Long-term caching (immutable)
   - HTML: No cache (for updates)
   - Assets: Versioned caching

## 🎯 Expected URLs

After deployment:
- **Main site**: `https://your-project.pages.dev`
- **Custom domain**: `https://your-domain.com` (if configured)
- **Preview**: Each commit gets a preview URL

## ✅ Post-Deployment Checklist

- [ ] Site loads without errors
- [ ] WASM files load properly  
- [ ] File upload works
- [ ] Search functionality works
- [ ] Progressive loading works
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS certificate active

Your RipGrep-Lite WASM app is now live on Cloudflare's global CDN! 🌍 