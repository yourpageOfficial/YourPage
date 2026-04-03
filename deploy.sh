#!/bin/bash
set -e

# ============================================
# YourPage Production Deploy Script
# Run on GCP VM after SSH
# ============================================

DOMAIN="${1:?Usage: ./deploy.sh yourdomain.com}"
echo "🚀 Deploying YourPage to $DOMAIN"

# 1. Install Docker
if ! command -v docker &> /dev/null; then
  echo "📦 Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "⚠️  Log out and back in, then re-run this script"
  exit 0
fi

# 2. Clone repo (or pull latest)
if [ ! -d "YourPage" ]; then
  echo "📥 Clone your repo here first:"
  echo "   git clone <your-repo-url> YourPage"
  exit 1
fi
cd YourPage

# 3. Generate .env if not exists
if [ ! -f .env ]; then
  echo "🔐 Generating .env..."
  JWT_SECRET=$(openssl rand -hex 32)
  DB_PASS=$(openssl rand -hex 16)
  REDIS_PASS=$(openssl rand -hex 16)
  MINIO_PASS=$(openssl rand -hex 16)
  GRAFANA_PASS=$(openssl rand -hex 8)

  cat > .env <<EOF
DOMAIN=$DOMAIN
DB_USER=yourpage
DB_PASSWORD=$DB_PASS
DB_NAME=yourpage
REDIS_PASSWORD=$REDIS_PASS
JWT_SECRET=$JWT_SECRET
MINIO_USER=minioadmin
MINIO_PASSWORD=$MINIO_PASS
GRAFANA_PASSWORD=$GRAFANA_PASS
EOF
  echo "  ✅ .env created (passwords auto-generated)"
fi

source .env

# 4. Setup Nginx config with domain
echo "🌐 Configuring Nginx for $DOMAIN..."
cp nginx/nginx.production.conf nginx/nginx.conf
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx.conf

# 5. First deploy without SSL (for certbot challenge)
echo "🔧 Starting services (HTTP only first)..."
# Temporarily use HTTP-only config
cat > nginx/nginx.conf <<TMPCONF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location /health { return 200 'ok'; }
    location / { return 200 'Setting up SSL...'; add_header Content-Type text/plain; }
}
TMPCONF

docker compose -f docker-compose.production.yml up -d nginx
sleep 5

# 6. Get SSL certificate
echo "🔒 Getting SSL certificate..."
docker compose -f docker-compose.production.yml run --rm certbot \
  certbot certonly --webroot -w /var/www/certbot \
  --email admin@$DOMAIN --agree-tos --no-eff-email \
  -d $DOMAIN

# 7. Restore full Nginx config
echo "🌐 Enabling HTTPS..."
cp nginx/nginx.production.conf nginx/nginx.conf
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx.conf

# 8. Start everything
echo "🚀 Starting all services..."
docker compose -f docker-compose.production.yml up -d --build

echo ""
echo "⏳ Waiting for services..."
sleep 30

# 9. Verify
echo ""
echo "=== Verification ==="
curl -s -o /dev/null -w "  HTTPS: %{http_code}\n" "https://$DOMAIN/health" || echo "  ⚠️ HTTPS not ready yet"
curl -s -o /dev/null -w "  API:   %{http_code}\n" "https://$DOMAIN/api/v1/tiers" || true

echo ""
echo "============================================"
echo "  ✅ YourPage deployed to https://$DOMAIN"
echo "============================================"
echo ""
echo "  Admin login: admin@yourpage.id / admin123"
echo "  ⚠️  CHANGE ADMIN PASSWORD IMMEDIATELY!"
echo ""
echo "  Grafana: https://$DOMAIN:3002"
echo "  MinIO Console: internal only (port 9001)"
echo ""
echo "  Useful commands:"
echo "    docker compose -f docker-compose.production.yml logs -f"
echo "    docker compose -f docker-compose.production.yml ps"
echo "    ./backup.sh  # DB backup"
echo ""
