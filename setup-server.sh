#!/bin/bash
set -e

# ============================================
# YourPage — First Time Server Setup
# Run once on GCP VM after SSH
# Usage: ./setup-server.sh yourdomain.com
# ============================================

DOMAIN="${1:?Usage: ./setup-server.sh yourdomain.com}"
REPO="${2:?Usage: ./setup-server.sh yourdomain.com github.com/user/repo}"

echo "🚀 Setting up YourPage server for $DOMAIN"

# 1. Install Docker
if ! command -v docker &> /dev/null; then
  echo "📦 Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  newgrp docker
fi

# 2. Install Docker Compose plugin
if ! docker compose version &> /dev/null; then
  sudo apt-get update && sudo apt-get install -y docker-compose-plugin
fi

# 3. Clone repo
if [ ! -d ~/YourPage ]; then
  echo "📥 Cloning repo..."
  git clone "https://$REPO.git" ~/YourPage
fi
cd ~/YourPage

# 4. Generate .env
if [ ! -f .env ]; then
  echo "🔐 Generating secure .env..."
  cat > .env <<EOF
DOMAIN=$DOMAIN
DB_USER=yourpage
DB_PASSWORD=$(openssl rand -hex 16)
DB_NAME=yourpage
REDIS_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
MINIO_USER=minioadmin
MINIO_PASSWORD=$(openssl rand -hex 16)
GRAFANA_PASSWORD=$(openssl rand -hex 8)
EOF
  echo "  ✅ .env created"
  echo "  ⚠️  SAVE THESE PASSWORDS — stored in ~/YourPage/.env"
fi

source .env

# 5. Setup Nginx (HTTP first for SSL challenge)
echo "🌐 Configuring Nginx..."
mkdir -p nginx/ssl
cat > nginx/nginx.conf <<TMPCONF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { proxy_pass http://frontend; }
}
upstream frontend { server fe:3000; }
TMPCONF

# 6. Build & start
echo "🔧 Building (this takes 3-5 minutes first time)..."
docker compose -f docker-compose.production.yml up -d --build
sleep 30

# 7. SSL
echo "🔒 Getting SSL certificate for $DOMAIN..."
docker compose -f docker-compose.production.yml run --rm certbot \
  certbot certonly --webroot -w /var/www/certbot \
  --email admin@$DOMAIN --agree-tos --no-eff-email \
  -d $DOMAIN || echo "⚠️ SSL failed — make sure DNS points to this server"

# 8. Enable HTTPS config
if [ -f nginx/ssl/live/$DOMAIN/fullchain.pem ]; then
  cp nginx/nginx.production.conf nginx/nginx.conf
  sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx.conf
  docker compose -f docker-compose.production.yml restart nginx
  echo "  ✅ HTTPS enabled"
else
  echo "  ⚠️ SSL not ready — using HTTP for now"
fi

# 9. Setup auto-renew SSL
echo "0 0 * * * cd ~/YourPage && docker compose -f docker-compose.production.yml run --rm certbot certbot renew && docker compose -f docker-compose.production.yml restart nginx" | crontab -

# 10. Setup daily DB backup
echo "0 3 * * * cd ~/YourPage && ./backup.sh" >> /tmp/cron_tmp
crontab /tmp/cron_tmp && rm /tmp/cron_tmp

echo ""
echo "============================================"
echo "  ✅ YourPage is live!"
echo "============================================"
echo ""
echo "  🌐 https://$DOMAIN"
echo "  👤 Admin: admin@yourpage.id / admin123"
echo "  ⚠️  CHANGE ADMIN PASSWORD NOW!"
echo ""
echo "  📊 Grafana: http://$DOMAIN:3002"
echo "     Login: admin / $GRAFANA_PASSWORD"
echo ""
echo "  🔄 Auto-deploy: push to main branch on GitHub"
echo "  💾 Auto-backup: daily at 3 AM"
echo "  🔒 SSL auto-renew: daily check"
echo ""
