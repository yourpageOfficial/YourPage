#!/bin/bash
set -e

echo "============================================"
echo "  YourPage Server Setup"
echo "============================================"

# 1. Install Docker
if ! command -v docker &> /dev/null; then
  echo "📦 Installing Docker..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo usermod -aG docker $USER
  echo "✅ Docker installed"
fi

# 2. Install Git
if ! command -v git &> /dev/null; then
  sudo apt-get install -y git
fi

# 3. Clone repo
if [ ! -d ~/YourPage ]; then
  echo "📥 Cloning repo..."
  git clone https://github.com/yourpageOfficial/YourPage.git ~/YourPage
fi
cd ~/YourPage

# 4. Generate .env
if [ ! -f .env ]; then
  echo "🔐 Generating .env..."
  cat > .env <<EOF
DOMAIN=_
DB_USER=yourpage
DB_PASSWORD=$(openssl rand -hex 16)
DB_NAME=yourpage
REDIS_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
MINIO_USER=minioadmin
MINIO_PASSWORD=$(openssl rand -hex 16)
GRAFANA_PASSWORD=$(openssl rand -hex 8)
EOF
  echo "✅ .env created"
  cat .env
  echo ""
  echo "⚠️  SAVE THESE PASSWORDS!"
fi

# 5. Build & Start
echo "🔧 Building (first time takes 5-10 minutes)..."
sudo docker compose -f docker-compose.production.yml up -d --build 2>&1 | tail -20

echo ""
echo "⏳ Waiting 30s for services to start..."
sleep 30

# 6. Verify
echo ""
echo "=== Verification ==="
sudo docker compose -f docker-compose.production.yml ps
echo ""
curl -s -o /dev/null -w "Health: %{http_code}\n" http://localhost/health 2>/dev/null || echo "Health: checking..."
curl -s -o /dev/null -w "API:    %{http_code}\n" http://localhost/api/v1/tiers 2>/dev/null || echo "API: checking..."
curl -s -o /dev/null -w "FE:     %{http_code}\n" http://localhost/ 2>/dev/null || echo "FE: checking..."

# Get external IP
EXT_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google" 2>/dev/null || curl -s ifconfig.me)

echo ""
echo "============================================"
echo "  ✅ YourPage is running!"
echo "============================================"
echo ""
echo "  🌐 http://$EXT_IP"
echo "  👤 Admin: admin@yourpage.id / admin123"
echo ""
echo "  Next steps:"
echo "  1. Open http://$EXT_IP in browser"
echo "  2. Point domain DNS A record → $EXT_IP"
echo "  3. Run: cd ~/YourPage && ./setup-ssl.sh yourdomain.com"
echo ""
