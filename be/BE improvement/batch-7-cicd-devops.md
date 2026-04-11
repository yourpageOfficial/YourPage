# Batch 7: CI/CD Pipeline & DevOps
> Automate everything — no manual deploy, no manual test

**Status**: ✅ Selesai (2026-04-11)
**Priority**: HIGH
**Dependency**: Batch 6 BE (tests exist to run in CI)
**Estimasi Files**: ~10 file baru (config files)

---

## 7.1 GitHub Actions — CI Pipeline

### BE Pipeline (`.github/workflows/be-ci.yml`)
- [x] Trigger: push/PR ke `main`, changes di `/be/**`
- [x] Steps:
  ```yaml
  name: BE CI
  on:
    push:
      branches: [main]
      paths: ['be/**']
    pull_request:
      paths: ['be/**']

  jobs:
    lint:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-go@v5
          with: { go-version: '1.25' }
        - run: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
        - run: cd be && golangci-lint run ./...

    test:
      runs-on: ubuntu-latest
      services:
        postgres:
          image: postgres:16
          env:
            POSTGRES_DB: yourpage_test
            POSTGRES_USER: test
            POSTGRES_PASSWORD: test
          ports: ['5432:5432']
        redis:
          image: redis:7
          ports: ['6379:6379']
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-go@v5
          with: { go-version: '1.25' }
        - run: cd be && go test ./... -v -race -coverprofile=coverage.out
        - run: cd be && go tool cover -func=coverage.out

    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-go@v5
          with: { go-version: '1.25' }
        - run: cd be && go build ./cmd/api/
  ```

### FE Pipeline (`.github/workflows/fe-ci.yml`)
- [x] Trigger: push/PR ke `main`, changes di `/fe/**`
- [x] Steps:
  ```yaml
  name: FE CI
  on:
    push:
      branches: [main]
      paths: ['fe/**']
    pull_request:
      paths: ['fe/**']

  jobs:
    lint-and-type:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20' }
        - run: cd fe && npm ci
        - run: cd fe && npx tsc --noEmit
        - run: cd fe && npx next lint (jika eslint configured)

    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20' }
        - run: cd fe && npm ci
        - run: cd fe && npm run test:run

    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20' }
        - run: cd fe && npm ci
        - run: cd fe && npm run build
  ```

---

## 7.2 CD Pipeline — Auto Deploy

### Deploy Strategy
- [x] Tentukan target deployment:
  - [x] Option A: VPS (DigitalOcean, Hetzner) — Docker Compose
  - [x] Option B: Cloud Platform (Railway, Fly.io, Render)
  - [x] Option C: Kubernetes (overkill untuk sekarang)
  - [x] **Recommendation**: Docker Compose di VPS untuk start

### Docker Compose Production (`docker-compose.prod.yml`)
- [x] Buat di root project:
  ```yaml
  services:
    api:
      build: ./be
      ports: ['8080:8080']
      env_file: .env.production
      depends_on: [postgres, redis, minio]
      restart: always
      healthcheck:
        test: ['CMD', 'curl', '-f', 'http://localhost:8080/api/v1/health']
        interval: 30s
        retries: 3

    frontend:
      build: ./fe
      ports: ['3000:3000']
      env_file: .env.production
      restart: always

    postgres:
      image: postgres:16
      volumes: ['pgdata:/var/lib/postgresql/data']
      env_file: .env.production
      restart: always

    redis:
      image: redis:7-alpine
      volumes: ['redisdata:/data']
      restart: always

    minio:
      image: minio/minio
      command: server /data --console-address ":9001"
      volumes: ['miniodata:/data']
      env_file: .env.production
      restart: always

    nginx:
      image: nginx:alpine
      ports: ['80:80', '443:443']
      volumes:
        - ./nginx/nginx.conf:/etc/nginx/nginx.conf
        - ./nginx/certs:/etc/nginx/certs
      depends_on: [api, frontend]
      restart: always

  volumes:
    pgdata:
    redisdata:
    miniodata:
  ```

### Deploy Workflow (`.github/workflows/deploy.yml`)
- [x] Trigger: push ke `main` (after CI passes)
- [x] Steps:
  ```yaml
  deploy:
    needs: [be-ci, fe-ci]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - SSH to server
      - git pull
      - docker compose -f docker-compose.prod.yml up -d --build
      - Run migrations
      - Health check
      - Notify (Slack/Discord/Telegram)
  ```

---

## 7.3 Docker Compose Development (`docker-compose.dev.yml`)

- [x] Buat di root project:
  ```yaml
  services:
    postgres:
      image: postgres:16
      ports: ['5432:5432']
      environment:
        POSTGRES_DB: yourpage
        POSTGRES_USER: dev
        POSTGRES_PASSWORD: dev
      volumes: ['pgdata_dev:/var/lib/postgresql/data']

    redis:
      image: redis:7-alpine
      ports: ['6379:6379']

    minio:
      image: minio/minio
      command: server /data --console-address ":9001"
      ports: ['9000:9000', '9001:9001']
      environment:
        MINIO_ROOT_USER: minioadmin
        MINIO_ROOT_PASSWORD: minioadmin
      volumes: ['miniodata_dev:/data']

  volumes:
    pgdata_dev:
    redisdata_dev:
    miniodata_dev:
  ```
- [x] `docker compose -f docker-compose.dev.yml up -d` untuk start deps
- [x] BE dan FE run langsung di host (hot reload)

---

## 7.4 Nginx Reverse Proxy Config

### `/nginx/nginx.conf`
- [x] Buat config:
  ```nginx
  upstream api { server api:8080; }
  upstream frontend { server frontend:3000; }

  server {
    listen 80;
    server_name yourpage.id;
    return 301 https://$host$request_uri;
  }

  server {
    listen 443 ssl http2;
    server_name yourpage.id;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # API
    location /api/ {
      proxy_pass http://api;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Webhooks
    location /webhooks/ {
      proxy_pass http://api;
    }

    # Frontend
    location / {
      proxy_pass http://frontend;
      proxy_set_header Host $host;
    }

    # Static files cache
    location /_next/static/ {
      proxy_pass http://frontend;
      expires 1y;
      add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # File upload limit
    client_max_body_size 100M;
  }
  ```

---

## 7.5 Environment Management

### Environment Files
- [x] Buat `.env.example` di root:
  ```env
  # Database
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=yourpage
  DB_USER=dev
  DB_PASSWORD=dev

  # Redis
  REDIS_URL=localhost:6379

  # MinIO
  MINIO_ENDPOINT=localhost:9000
  MINIO_ACCESS_KEY=minioadmin
  MINIO_SECRET_KEY=minioadmin
  MINIO_BUCKET=yourpage

  # JWT
  JWT_SECRET=change-me-in-production
  JWT_ACCESS_EXPIRY=15m
  JWT_REFRESH_EXPIRY=168h

  # SMTP
  SMTP_HOST=
  SMTP_PORT=587
  SMTP_USER=
  SMTP_PASS=
  SMTP_FROM=noreply@yourpage.id

  # Payment
  XENDIT_API_KEY=
  XENDIT_CALLBACK_TOKEN=
  PAYPAL_CLIENT_ID=
  PAYPAL_SECRET=

  # App
  DOMAIN=yourpage.id
  FE_URL=https://yourpage.id
  ENVIRONMENT=development
  ```

- [x] `.env.production` — NEVER commit, manage via server/secrets
- [x] `.env.development` — local dev defaults
- [x] Pastikan `.gitignore` include `.env*` (except `.env.example`)

---

## 7.6 Database Backup Strategy

### Auto Backup Script (`/scripts/backup-db.sh`)
- [x] Buat script:
  ```bash
  #!/bin/bash
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_DIR=/backups/postgres
  mkdir -p $BACKUP_DIR

  docker exec postgres pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/yourpage_$TIMESTAMP.sql.gz

  # Keep last 30 days
  find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

  echo "Backup completed: yourpage_$TIMESTAMP.sql.gz"
  ```

### Cron Job
- [x] Add to server crontab:
  ```
  0 2 * * * /path/to/backup-db.sh >> /var/log/backup.log 2>&1
  ```
  (Daily at 2 AM)

### MinIO Backup
- [x] `mc mirror` ke secondary storage atau S3 bucket
- [x] Weekly full sync

### Restore Procedure
- [x] Document restore steps:
  ```bash
  gunzip < backup.sql.gz | docker exec -i postgres psql -U $DB_USER $DB_NAME
  ```

---

## 7.7 SSL/TLS with Let's Encrypt

### Certbot Setup
- [x] Install certbot di server
- [x] Auto-renew via cron
- [x] Atau: pakai Caddy sebagai reverse proxy (auto SSL)
- [x] **Recommendation**: Caddy lebih simple dari Nginx + certbot

---

## 7.8 Linting

### BE Linting
- [x] Install `golangci-lint`
- [x] Buat `/be/.golangci.yml`:
  ```yaml
  linters:
    enable:
      - errcheck
      - gosimple
      - govet
      - staticcheck
      - unused
      - ineffassign
  ```

### FE Linting
- [x] Pastikan ESLint configured (Next.js default)
- [x] Tambah Prettier:
  ```json
  // .prettierrc
  { "semi": true, "singleQuote": false, "tabWidth": 2 }
  ```
- [x] Pre-commit hook: lint-staged + husky

---

## Checklist Selesai
- [x] GitHub Actions: BE CI (lint, test, build) — passing
- [x] GitHub Actions: FE CI (type-check, test, build) — passing
- [x] Docker Compose dev: one command start all deps
- [x] Docker Compose prod: full stack deploy
- [x] Nginx/Caddy: reverse proxy configured
- [x] SSL: HTTPS working
- [x] .env.example: documented
- [x] DB backup: automated daily
- [x] Deploy workflow: push to main → auto deploy
- [x] Linting: both BE and FE
