#!/bin/bash
# MatchingDB GCE VM — Full Production Deployment
# Builds webpack bundles, compiles backend TS, starts PM2 cluster via ecosystem.config.js,
# and reloads nginx to serve static files directly (no Node UI servers).
#
# Prerequisites (run once manually):
#   sudo apt install -y nginx certbot python3-certbot-nginx
#   sudo certbot --nginx -d matchingdb.com -d www.matchingdb.com
#   sudo ln -s /opt/matchdb/nginx-matchingdb.conf /etc/nginx/sites-available/matchingdb
#   sudo ln -s /etc/nginx/sites-available/matchingdb /etc/nginx/sites-enabled/matchingdb
#   pm2 startup   # generate systemd unit
#
# Usage (on VM):  bash deploy-gce-ui.sh
set -euo pipefail

BASE=/opt/matchdb
GITHUB_ORG=shakthimaharaja

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   MatchingDB — GCP Production Deployment             ║"
echo "╚══════════════════════════════════════════════════╝"

# ── 1. Clone / pull all four repos ──────────────────────────────────────────
echo ""
echo ">>> [1/8] Syncing repositories..."
mkdir -p "$BASE/logs"
cd "$BASE"

for REPO in matchdb-shell-services matchdb-jobs-services matchdb-shell-ui matchdb-jobs-ui; do
  if [ -d "$BASE/$REPO/.git" ]; then
    echo "    git pull $REPO"
    git -C "$BASE/$REPO" pull --ff-only
  else
    echo "    git clone $REPO"
    git clone "https://github.com/$GITHUB_ORG/$REPO.git" "$BASE/$REPO"
  fi
done

# Copy the ecosystem config to the base dir (if deploying from a checkout)
cp "$BASE/matchdb-shell-services/../ecosystem.config.js" "$BASE/ecosystem.config.js" 2>/dev/null || true

# ── 2. Production env for webpack builds ─────────────────────────────────────
echo ""
echo ">>> [2/8] Writing webpack env files..."

mkdir -p "$BASE/matchdb-shell-ui/env"
cat > "$BASE/matchdb-shell-ui/env/.env.production" << 'ENVEOF'
NODE_ENV=production
# Shell webpack: where to find the Jobs MFE remote entry
# nginx serves jobs-ui dist at /jobs-remote/
JOBS_UI_URL=https://matchingdb.com/jobs-remote
SHELL_SERVICES_URL=http://localhost:8000
JOBS_SERVICES_URL=http://localhost:8001
STRIPE_PUBLISHABLE_KEY=
ENVEOF

mkdir -p "$BASE/matchdb-jobs-ui/env"
cat > "$BASE/matchdb-jobs-ui/env/.env.production" << 'ENVEOF'
NODE_ENV=production
JOBS_SERVICES_URL=http://localhost:8001
ENVEOF

# ── 3. Build Jobs MFE FIRST (shell depends on its remoteEntry.js hash) ───────
echo ""
echo ">>> [3/8] Installing jobs-ui deps & building webpack..."
cd "$BASE/matchdb-jobs-ui"
npm ci --production=false
npx webpack --config webpack.config.js --env production
echo "    jobs-ui built → $BASE/matchdb-jobs-ui/dist/"

# ── 4. Build Shell UI ─────────────────────────────────────────────────────────
echo ""
echo ">>> [4/8] Installing shell-ui deps & building webpack..."
cd "$BASE/matchdb-shell-ui"
npm ci --production=false
npx webpack --config webpack.config.js --env production
echo "    shell-ui built → $BASE/matchdb-shell-ui/dist/"

# ── 5. Build backend services (TypeScript → dist/) ────────────────────────────
echo ""
echo ">>> [5/8] Building backend TypeScript..."

echo "    shell-services: npm install && tsc"
cd "$BASE/matchdb-shell-services"
npm install
npm run build          # tsc → dist/index.js

echo "    jobs-services: npm install && tsc"
cd "$BASE/matchdb-jobs-services"
npm install
npm run build          # tsc → dist/index.js

# ── 6. (MongoDB Atlas — no migrations needed) ─────────────────────────────────
echo ""
echo ">>> [6/8] Database: MongoDB Atlas (cloud-hosted, no migrations needed)"
echo "    Skipped — Mongoose handles schema at runtime."

# ── 7. Start / reload backend services via PM2 ecosystem ─────────────────────
echo ""
echo ">>> [7/8] Reloading PM2 cluster (zero-downtime)..."
cd "$BASE"

if pm2 list | grep -q "shell-services"; then
  # Reload reuses existing workers for zero-downtime
  pm2 reload ecosystem.config.js --env production
else
  pm2 start  ecosystem.config.js --env production
fi

pm2 save
echo "    PM2 cluster running."

# ── 8. Reload nginx (picks up new dist/ files) ───────────────────────────────
echo ""
echo ">>> [8/8] Testing & reloading nginx..."
sudo nginx -t
sudo systemctl reload nginx
echo "    nginx reloaded."

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Deployment complete                            ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  Site:         https://matchingdb.com"
echo "  Health (auth): https://matchingdb.com/health/shell"
echo "  Health (jobs): https://matchingdb.com/health/jobs"
echo ""
pm2 list
echo ""
echo "Tail logs:  pm2 logs"
echo "Monitor:    pm2 monit"
