# MatchingDB � GCP Deployment Guide (MERN Stack � MongoDB Atlas)

Complete guide to deploying the MatchingDB staffing platform on **Google Cloud Platform** using a Compute Engine VM, MongoDB Atlas, nginx, PM2, and Let's Encrypt SSL.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Database Schema Reference](#database-schema-reference)
4. [Step 1 � Create MongoDB Atlas Cluster](#step-1--create-mongodb-atlas-cluster)
5. [Step 2 � Create GCE VM Instance](#step-2--create-gce-vm-instance)
6. [Step 3 � SSH into VM & Install Dependencies](#step-3--ssh-into-vm--install-dependencies)
7. [Step 4 � Clone Repositories](#step-4--clone-repositories)
8. [Step 5 � Configure Environment Variables](#step-5--configure-environment-variables)
9. [Step 6 � Build Backend Services](#step-6--build-backend-services)
10. [Step 7 � Build Frontend UIs](#step-7--build-frontend-uis)
11. [Step 8 � Set Up PM2 Process Manager](#step-8--set-up-pm2-process-manager)
12. [Step 9 � Configure nginx Reverse Proxy](#step-9--configure-nginx-reverse-proxy)
13. [Step 10 � Set Up SSL with Let's Encrypt](#step-10--set-up-ssl-with-lets-encrypt)
14. [Step 11 � Configure Domain DNS](#step-11--configure-domain-dns)
15. [Step 12 � Seed Production Data](#step-12--seed-production-data)
16. [Step 13 � Verify Deployment](#step-13--verify-deployment)
17. [Maintenance & Operations](#maintenance--operations)
18. [Automated Deployment Script](#automated-deployment-script)
19. [Troubleshooting](#troubleshooting)

---

## 1. Architecture Overview

```
Internet
   |
   +--- DNS: matchingdb.com -> GCE VM External IP
   |
   +--- GCE VM (e2-medium, Ubuntu 22.04)
           |
           +-- nginx (:443 / :80)
           |     +-- /                    -> static files (Shell UI dist/)
           |     +-- /jobs-remote/        -> static files (Jobs UI dist/)
           |     +-- /api/auth/*          -> PM2 -> shell-services :8000
           |     +-- /api/payments/*      -> PM2 -> shell-services :8000
           |     +-- /api/jobs/*          -> PM2 -> jobs-services :8001
           |     +-- /api/marketer/*      -> PM2 -> jobs-services :8001
           |
           +-- PM2 (process manager)
           |     +-- shell-services x2 (cluster mode, :8000)
           |     +-- jobs-services  x2 (cluster mode, :8001)
           |
           +-- MongoDB Atlas (cloud-hosted)
                 +-- matchdb-shell (4 collections - auth, users, payments)
                 +-- matchdb-jobs  (12 collections - jobs, profiles, marketer)
```

**Key design decisions:**

- nginx serves static frontend files directly (no Node UI servers in production)
- PM2 runs backend services in cluster mode (2 workers each) with auto-restart
- Each service connects to its own MongoDB Atlas database � no local DB needed
- SSL via Let's Encrypt certbot (auto-renew)

---

## 2. Prerequisites

- **Google Cloud account** with billing enabled
- **gcloud CLI** installed locally
- **MongoDB Atlas** account with a cluster (free M0 or paid)
- **Domain name** pointed to GCP (e.g., `matchingdb.com`)
- **GitHub access** to all MatchingDB repositories

```bash
# Authenticate gcloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

---

## Database Schema Reference

The complete database schema documentation is maintained in a separate file:

> [DATABASE-SCHEMA.md](DATABASE-SCHEMA.md) � Full reference for all 16 MongoDB collections, fields, types, indexes, and relationships.

Key highlights:

| Domain   | Collections                                                              | Description                                       |
| -------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Auth     | `users`, `subscriptions`, `refreshtokens`, `candidatepayments`           | User accounts, Stripe billing, JWT tokens         |
| Jobs     | `jobs`, `candidateprofiles`, `applications`, `pokerecords`, `pokelogs`   | Job postings, profiles, applications, poke system |
| Marketer | `companies`, `marketercandidates`, `forwardedopenings`, `companyinvites` | Staffing company roster & job forwarding          |
| Finance  | `projectfinancials`, `timesheets`, `interviewinvites`                    | Project billing, timesheets, interviews           |

Collections are created automatically by Mongoose on first use. No migrations needed.

---

## Step 1 � Create MongoDB Atlas Cluster

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create an account
2. Create a **Shared Cluster** (M0 free tier or M2/M5 for production)
3. Choose region close to your GCE VM (e.g., `us-central1`)
4. **Network Access:** Add your GCE VM's external IP or `0.0.0.0/0` for development
5. **Database Access:** Create a user with readWrite permissions
6. **Get connection string:** Click "Connect" -> "Connect your application" -> copy the `mongodb+srv://` URI

Example connection string:

```
mongodb+srv://your_user:your_password@cluster.xxxxx.mongodb.net/matchdb-shell?retryWrites=true&w=majority
```

> **Security note:** In production, restrict Network Access to your VM's external IP only.

---

## Step 2 � Create GCE VM Instance

```bash
# Create VM
gcloud compute instances create matchdb-vm \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=http-server,https-server

# Open firewall for HTTP/HTTPS
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80 \
  --target-tags=http-server

gcloud compute firewall-rules create allow-https \
  --allow=tcp:443 \
  --target-tags=https-server
```

---

## Step 3 � SSH into VM & Install Dependencies

```bash
gcloud compute ssh matchdb-vm --zone=us-central1-a
```

```bash
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git, nginx, PM2
sudo apt-get install -y git nginx
sudo systemctl enable nginx
sudo npm install -g pm2
```

---

## Step 4 � Clone Repositories

```bash
sudo mkdir -p /opt/matchdb/logs
sudo chown -R $USER:$USER /opt/matchdb
cd /opt/matchdb

git clone https://github.com/YOUR_ORG/matchdb-shell-services.git
git clone https://github.com/YOUR_ORG/matchdb-jobs-services.git
git clone https://github.com/YOUR_ORG/matchdb-shell-ui.git
git clone https://github.com/YOUR_ORG/matchdb-jobs-ui.git
```

---

## Step 5 � Configure Environment Variables

### Shell Services (.env)

```bash
cat > /opt/matchdb/matchdb-shell-services/.env << 'EOF'
PORT=8000
NODE_ENV=production
MONGO_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/matchdb-shell?retryWrites=true&w=majority
JWT_SECRET=GENERATE_A_STRONG_64_CHAR_SECRET_HERE
JWT_REFRESH_SECRET=GENERATE_ANOTHER_STRONG_64_CHAR_SECRET_HERE
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://matchingdb.com/api/auth/google/callback
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@matchingdb.com
SENDGRID_FROM_NAME=MatchingDB
CLIENT_URL=https://matchingdb.com
CORS_ORIGINS=https://matchingdb.com
EOF
```

### Jobs Services (.env)

```bash
cat > /opt/matchdb/matchdb-jobs-services/.env << 'EOF'
PORT=8001
NODE_ENV=production
MONGO_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/matchdb-jobs?retryWrites=true&w=majority
JWT_SECRET=SAME_JWT_SECRET_AS_SHELL_SERVICES
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@matchingdb.com
SENDGRID_FROM_NAME=MatchingDB
CORS_ORIGINS=https://matchingdb.com
CLIENT_URL=https://matchingdb.com
EOF
```

> **Critical:** `JWT_SECRET` must be identical in both services. Generate secrets with: `openssl rand -base64 48`

---

## Step 6 � Build Backend Services

### Shell Services

```bash
cd /opt/matchdb/matchdb-shell-services
npm ci --production=false
npm run build
```

### Jobs Services

```bash
cd /opt/matchdb/matchdb-jobs-services
npm ci --production=false
npm run build
```

> No migration step needed � Mongoose creates collections and indexes automatically at startup.

---

## Step 7 � Build Frontend UIs

### Jobs UI (Remote MFE � build first)

```bash
cd /opt/matchdb/matchdb-jobs-ui
npm ci --production=false
npm run build
```

### Shell UI (Host)

```bash
cd /opt/matchdb/matchdb-shell-ui
npm ci --production=false
npm run build
```

---

## Step 8 � Set Up PM2 Process Manager

```bash
cd /opt/matchdb
pm2 start ecosystem.config.js --env production
pm2 status
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

### Verify Health

```bash
curl http://localhost:8000/health   # {"status":"ok"}
curl http://localhost:8001/health   # {"status":"ok"}
```

---

## Step 9 � Configure nginx Reverse Proxy

The nginx config is at `nginx-matchingdb.conf` in the repo root. Copy it to the server:

```bash
sudo cp /opt/matchdb/nginx-matchingdb.conf /etc/nginx/sites-available/matchingdb
sudo ln -sf /etc/nginx/sites-available/matchingdb /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 10 � Set Up SSL with Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d matchingdb.com -d www.matchingdb.com
sudo certbot renew --dry-run
```

---

## Step 11 � Configure Domain DNS

| Type | Name | Value            | TTL |
| ---- | ---- | ---------------- | --- |
| A    | @    | `VM_EXTERNAL_IP` | 300 |
| A    | www  | `VM_EXTERNAL_IP` | 300 |

---

## Step 12 � Seed Production Data

```bash
cd /opt/matchdb/matchdb-shell-services
npx tsx src/scripts/seed.ts
```

---

## Step 13 � Verify Deployment

```bash
pm2 status
curl https://matchingdb.com/health/shell
curl https://matchingdb.com/health/jobs
```

Open **https://matchingdb.com** in your browser.

---

## Maintenance & Operations

### Deploy Updates

```bash
cd /opt/matchdb/matchdb-shell-services && git pull && npm ci --production=false && npm run build
cd /opt/matchdb/matchdb-jobs-services && git pull && npm ci --production=false && npm run build
cd /opt/matchdb/matchdb-shell-ui && git pull && npm ci --production=false && npm run build
cd /opt/matchdb/matchdb-jobs-ui && git pull && npm ci --production=false && npm run build

cd /opt/matchdb
pm2 reload ecosystem.config.js --env production
sudo systemctl reload nginx
```

### MongoDB Atlas Backup

MongoDB Atlas includes automated daily backups on M2+ clusters.

- Configure backup schedule in Atlas UI under "Backup" tab
- Use `mongodump`/`mongorestore` for manual backups if needed

### Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## Automated Deployment Script

```bash
bash deploy-gce.sh
```

---

## Troubleshooting

| Issue                          | Solution                                                               |
| ------------------------------ | ---------------------------------------------------------------------- |
| **502 Bad Gateway**            | PM2 crashed � run `pm2 status` and `pm2 logs`                          |
| **504 Gateway Timeout**        | Backend overloaded � check `pm2 monit`                                 |
| **MongoDB connection refused** | Check MONGO_URI in .env; verify Atlas Network Access includes VM IP    |
| **SSL certificate error**      | Run `sudo certbot renew --force-renewal`                               |
| **Module Federation error**    | Rebuild jobs-ui; check remoteEntry.js at `/jobs-remote/remoteEntry.js` |
| **PM2 not starting on boot**   | Re-run `pm2 save` then `pm2 startup`                                   |

---

## Cost Estimate (Monthly)

| Resource            | Spec               | ~Cost/month |
| ------------------- | ------------------ | ----------- |
| GCE VM (e2-medium)  | 2 vCPU, 4 GB RAM   | ~$25        |
| MongoDB Atlas (M0)  | Free tier (512 MB) | $0          |
| MongoDB Atlas (M2)  | Production (2 GB)  | ~$9         |
| Static IP           | 1 address          | ~$3         |
| SSL (Let's Encrypt) | Free               | $0          |
| **Total (free DB)** |                    | **~$28/mo** |
| **Total (paid DB)** |                    | **~$37/mo** |

---

## Security Checklist

- [ ] Use strong JWT secrets (64+ characters)
- [ ] Restrict MongoDB Atlas Network Access to VM IP only
- [ ] Set GCE firewall to allow only ports 80, 443, and 22 (SSH)
- [ ] Enable MongoDB Atlas automated backups
- [ ] Set up PM2 log rotation
- [ ] Configure Stripe webhook endpoint to production URL
- [ ] Update Google OAuth callback URL to production domain
- [ ] Remove test seed data before going live
- [ ] Set `NODE_ENV=production` in all .env files
