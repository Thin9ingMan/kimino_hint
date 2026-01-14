# クイズ機能 デプロイメントガイド

## 環境変数設定

### 必須環境変数

```bash
# API Base URL
VITE_API_BASE_URL=https://quarkus-crud.ouchiserver.aokiapp.com

# 環境識別
VITE_ENV=production  # development | staging | production

# LLM API設定
VITE_LLM_TIMEOUT=30000  # タイムアウト（ミリ秒）

# Feature Flags
VITE_ENABLE_QUIZ=true
VITE_ENABLE_LLM_GENERATION=true
```

### オプション環境変数

```bash
# エラートラッキング
VITE_SENTRY_DSN=https://...

# アナリティクス
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# デバッグモード
VITE_DEBUG=false
```

## ビルドプロセス

### 1. 開発環境

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ポート: http://localhost:5173
```

### 2. プロダクションビルド

```bash
# TypeScriptチェック
npm run typecheck

# Linting
npm run lint

# ビルド
npm run build

# 出力: dist/
```

### 3. プレビュー

```bash
# ビルド後のプレビュー
npm run preview

# ポート: http://localhost:4173
```

## GitHub Pages デプロイ

### 自動デプロイ（GitHub Actions）

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run typecheck
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          VITE_ENV: production
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 手動デプロイ

```bash
# ビルドとデプロイ
npm run deploy
```

## Docker デプロイ

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
ARG VITE_API_BASE_URL
ARG VITE_ENV=production
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ENV=$VITE_ENV

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass https://quarkus-crud.ouchiserver.aokiapp.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
}
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      args:
        VITE_API_BASE_URL: https://quarkus-crud.ouchiserver.aokiapp.com
        VITE_ENV: production
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## Vercel デプロイ

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 環境別設定

### Development

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080
VITE_ENV=development
VITE_DEBUG=true
VITE_ENABLE_QUIZ=true
VITE_ENABLE_LLM_GENERATION=true
```

### Staging

```bash
# .env.staging
VITE_API_BASE_URL=https://staging-api.example.com
VITE_ENV=staging
VITE_DEBUG=true
VITE_ENABLE_QUIZ=true
VITE_ENABLE_LLM_GENERATION=true
```

### Production

```bash
# .env.production
VITE_API_BASE_URL=https://quarkus-crud.ouchiserver.aokiapp.com
VITE_ENV=production
VITE_DEBUG=false
VITE_ENABLE_QUIZ=true
VITE_ENABLE_LLM_GENERATION=true
VITE_SENTRY_DSN=https://...
```

## CDN設定（オプション）

### Cloudflare

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
```

## モニタリング設定

### Sentry統合

```typescript
// app/main.tsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENV,
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

### Google Analytics

```typescript
// app/main.tsx
import ReactGA from "react-ga4";

if (import.meta.env.VITE_GA_TRACKING_ID) {
  ReactGA.initialize(import.meta.env.VITE_GA_TRACKING_ID);
}
```

## デプロイチェックリスト

### ビルド前
- [ ] TypeScriptエラーなし (`npm run typecheck`)
- [ ] Lintエラーなし (`npm run lint`)
- [ ] 全テスト通過
- [ ] 環境変数設定確認
- [ ] API接続テスト

### ビルド
- [ ] プロダクションビルド成功
- [ ] バンドルサイズ確認（< 2MB推奨）
- [ ] ソースマップ生成確認
- [ ] アセット最適化確認

### デプロイ後
- [ ] 本番環境でアクセス確認
- [ ] 全ページ表示確認
- [ ] クイズフロー動作確認
- [ ] API通信確認
- [ ] エラートラッキング動作確認
- [ ] パフォーマンステスト
- [ ] セキュリティヘッダー確認
- [ ] HTTPS動作確認

## ロールバック手順

### GitHub Pages

```bash
# 前のコミットにロールバック
git revert HEAD
git push origin main

# または特定のバージョンにデプロイ
git checkout <commit-hash>
npm run deploy
```

### Docker

```bash
# 前のイメージにロールバック
docker pull myapp:previous-tag
docker-compose up -d
```

## トラブルシューティング

### ビルドエラー

```bash
# キャッシュクリア
rm -rf node_modules dist
npm install
npm run build
```

### デプロイエラー

```bash
# GitHub Pagesのキャッシュクリア
git commit --allow-empty -m "Trigger rebuild"
git push origin main
```

### API接続エラー

```bash
# CORS設定確認
# nginx.conf または API側の設定を確認

# プロキシ設定確認
# vite.config.js の proxy 設定を確認
```

## パフォーマンス最適化

### コード分割

```typescript
// Lazy loading
const QuizEditScreen = lazy(() => import('./QuizEditScreen'));
```

### 画像最適化

```bash
# 画像圧縮
npm install --save-dev vite-plugin-imagemin

# vite.config.js
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      svgo: { plugins: [{ removeViewBox: false }] },
    }),
  ],
});
```

### プリロード

```html
<!-- index.html -->
<link rel="preconnect" href="https://quarkus-crud.ouchiserver.aokiapp.com">
<link rel="dns-prefetch" href="https://quarkus-crud.ouchiserver.aokiapp.com">
```

## セキュリティ

### CSP設定

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://quarkus-crud.ouchiserver.aokiapp.com;">
```

### 環境変数の保護

```bash
# .env ファイルを .gitignore に追加
echo ".env*" >> .gitignore

# GitHub Secrets に保存
# Settings > Secrets > New repository secret
```

## サポート

問題が発生した場合:
1. ログを確認
2. Sentryでエラーを確認
3. GitHubのIssueを作成
4. 開発チームに連絡
