#!/bin/bash
# MatchingDB GCE VM Deployment Script (MERN Stack — MongoDB Atlas)
# Run this on the VM after SSH-ing in
set -e

echo "=== MatchingDB GCE Deployment ==="

# 1. Install Node.js 20
echo ">>> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version

# 2. Install Git
echo ">>> Installing Git..."
sudo apt-get install -y git

# 3. Create app directory
echo ">>> Setting up app directory..."
sudo mkdir -p /opt/matchdb
sudo chown $USER:$USER /opt/matchdb
cd /opt/matchdb

# 4. Clone repos
echo ">>> Cloning repositories..."
if [ -d "matchdb-shell-services" ]; then cd matchdb-shell-services && git pull && cd ..; else git clone https://github.com/shakthimaharaja/matchdb-shell-services.git; fi
if [ -d "matchdb-jobs-services" ]; then cd matchdb-jobs-services && git pull && cd ..; else git clone https://github.com/shakthimaharaja/matchdb-jobs-services.git; fi

# 5. Create shell-services .env
echo ">>> Creating shell-services environment..."
cat > /opt/matchdb/matchdb-shell-services/.env << 'ENVEOF'
PORT=8000
NODE_ENV=production
MONGO_URI=mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/matchdb-shell?retryWrites=true&w=majority
JWT_SECRET=<PROD_JWT_SECRET_MIN_32_CHARS>
JWT_REFRESH_SECRET=<PROD_JWT_REFRESH_SECRET_MIN_32_CHARS>
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://matchingdb.com:8000/api/auth/google/callback
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@matchingdb.com
SENDGRID_FROM_NAME=MatchingDB
CLIENT_URL=http://matchingdb.com:3000
CORS_ORIGINS=http://matchingdb.com:3000,http://matchingdb.com:3001,http://matchingdb.com:4000
ENVEOF

# 6. Create jobs-services .env
echo ">>> Creating jobs-services environment..."
cat > /opt/matchdb/matchdb-jobs-services/.env << 'ENVEOF'
PORT=8001
NODE_ENV=production
MONGO_URI=mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/matchdb-jobs?retryWrites=true&w=majority
JWT_SECRET=<PROD_JWT_SECRET_MIN_32_CHARS>
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@matchingdb.io
SENDGRID_FROM_NAME=MatchingDB
CORS_ORIGINS=http://matchingdb.com:3000,http://matchingdb.com:3001,http://matchingdb.com:4000,http://matchingdb.com:4001
CLIENT_URL=http://matchingdb.com:3000
ENVEOF

# 7. Build shell-services
echo ">>> Building shell-services..."
cd /opt/matchdb/matchdb-shell-services
npm ci --production=false
npm run build

# 8. Build jobs-services
echo ">>> Building jobs-services..."
cd /opt/matchdb/matchdb-jobs-services
npm ci --production=false
npm run build

# 9. Install PM2 for process management
echo ">>> Installing PM2..."
sudo npm install -g pm2

# 10. Stop existing services if running
pm2 delete all 2>/dev/null || true

# 11. Start services with PM2
echo ">>> Starting services..."
cd /opt/matchdb/matchdb-shell-services
pm2 start dist/index.js --name shell-services

cd /opt/matchdb/matchdb-jobs-services
pm2 start dist/index.js --name jobs-services

# 12. Save PM2 config and set startup
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER 2>/dev/null || true

echo ""
echo "=== Deployment Complete ==="
echo "Shell Services: http://matchingdb.com:8000"
echo "Jobs Services:  http://matchingdb.com:8001"
echo ""
pm2 status
echo ""
echo "Test with:"
echo "  curl http://localhost:8000/health"
echo "  curl http://localhost:8001/health"
