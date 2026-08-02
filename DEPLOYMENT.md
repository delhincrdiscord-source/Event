# DEPLOYMENT.md — Delhi NCR GameVerse Festival 2026

Complete production deployment guide.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Environment Variables](#3-environment-variables)
4. [Database Setup](#4-database-setup)
5. [Deploy Landing (Cloudflare Pages)](#5-deploy-landing-cloudflare-pages)
6. [Deploy Dashboard (VPS)](#6-deploy-dashboard-vps)
7. [Deploy Bot (VPS)](#7-deploy-bot-vps)
8. [Discord Developer Portal Setup](#8-discord-developer-portal-setup)
9. [DNS Configuration](#9-dns-configuration)
10. [SSL Certificates](#10-ssl-certificates)
11. [PM2 Process Manager](#11-pm2-process-manager)
12. [Deploy Slash Commands](#12-deploy-slash-commands)
13. [Health Checks](#13-health-checks)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >=20.x | `nvm install 20` |
| pnpm | 9.15.x | `npm i -g pnpm@9.15.0` |
| PM2 | latest | `npm i -g pm2` |
| Prisma CLI | latest | Included via `npx prisma` |
| Git | latest | https://git-scm.com |

---

## 2. Clone & Install

```bash
# Clone the repo
git clone https://github.com/your-org/gameverse.git
cd gameverse

# Install all dependencies
pnpm install

# Generate Prisma client
pnpm --filter=@gameverse/database db:generate
```

---

## 3. Environment Variables

### Production Environment

Copy `.env.example` to `.env` and fill in ALL values:

```bash
cp .env.example .env
```

**Required variables:**

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Neon / Supabase / Railway |
| `BETTER_AUTH_SECRET` | 64-char random hex string | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | `https://dashboard.delhincr.fun` | Already set |
| `DISCORD_CLIENT_ID` | Discord app client ID | Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | Discord app client secret | Discord Developer Portal |
| `DISCORD_GUILD_ID` | Target Discord server ID | Discord (enable Developer Mode) |
| `DISCORD_BOT_TOKEN` | Bot token | Discord Developer Portal |
| `UPSTASH_REDIS_REST_URL` | Redis REST URL | Upstash Console |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token | Upstash Console |
| `B2_KEY_ID` | Backblaze B2 key ID | B2 Cloud Storage Console |
| `B2_APP_KEY` | Backblaze B2 app key | B2 Cloud Storage Console |
| `B2_BUCKET_NAME` | B2 bucket name | Create in B2 Console |
| `B2_REGION` | `us-west-004` | B2 region |
| `TOKEN_ENCRYPTION_KEY` | 32-byte hex key | `openssl rand -hex 32` |
| `ADMIN_EMAIL` | Admin login email | Your email |
| `ADMIN_PASSWORD` | Admin login password | Choose a strong password |
| `HEALTH_ENDPOINT_TOKEN` | Random UUID for health checks | `uuidgen` |

### Sub-app sync

After setting root `.env`, copy it to each sub-app:

```bash
cp .env apps/dashboard/.env
cp .env apps/landing/.env
cp .env apps/bot/.env
cp .env packages/database/.env
```

---

## 4. Database Setup

### Neon PostgreSQL (Recommended)

1. Create account at https://neon.tech
2. Create a new project
3. Copy the connection string to `DATABASE_URL`
4. **Remove** `channel_binding=require` if present (Neon pooler doesn't support it)

### Push schema to database

```bash
# Generate Prisma client
pnpm --filter=@gameverse/database db:generate

# Push schema (creates/updates tables)
pnpm --filter=@gameverse/database db:push

# Seed roles, permissions, admin user, gamification data
pnpm --filter=@gameverse/database db:seed
```

### Verify database

```bash
# Open Prisma Studio to inspect data
pnpm --filter=@gameverse/database db:studio
```

---

## 5. Deploy Landing (Cloudflare Pages)

The landing app is a static Astro site — perfect for Cloudflare Pages.

### Option A: Git Integration (Recommended)

1. Push code to GitHub
2. Go to Cloudflare Dashboard → Pages
3. Click "Create a project" → "Connect to Git"
4. Select your repository
5. Configure:
   - **Production branch**: `main`
   - **Build command**: `pnpm install && pnpm --filter=@gameverse/landing build`
   - **Build output directory**: `apps/landing/dist`
   - **Node.js version**: `20`
6. Add environment variables:
   - `NODE_VERSION` = `20`
7. Deploy

### Option B: Wrangler CLI

```bash
# Install Wrangler
npm i -g wrangler

# Login to Cloudflare
wrangler login

# Build the landing app
pnpm --filter=@gameverse/landing build

# Deploy to Pages
wrangler pages deploy apps/landing/dist --project-name=gameverse-landing
```

### Custom Domain (Cloudflare Pages)

1. In Cloudflare Pages → Custom domains
2. Add `gameverse.delhincr.fun`
3. Cloudflare auto-configures DNS and SSL

---

## 6. Deploy Dashboard (VPS)

### Recommended Host: **Hetzner CX22** or **DigitalOcean Droplet**

**Why VPS over Vercel/Railway:**
- Full control over PM2, Nginx, SSL
- Cheaper at scale (€4.50/mo Hetzner vs $20+/mo Vercel Pro)
- No vendor lock-in
- Bot + Dashboard on same server = lower latency for Discord API calls
- Can run Nginx reverse proxy for both subdomains

### Server Setup (Ubuntu 22.04)

```bash
# SSH into your VPS
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm i -g pnpm@9.15.0

# Install PM2
npm i -g pm2

# Install Nginx
apt install -y nginx

# Create app directory
mkdir -p /opt/gameverse
```

### Deploy Code

```bash
# From your local machine
cd /opt/gameverse

# Clone repo
git clone https://github.com/your-org/gameverse.git .
pnpm install

# Configure environment
cp .env.example .env
nano .env  # Fill in all production values

# Build packages
pnpm --filter=@gameverse/database db:generate
pnpm --filter=@gameverse/ui build
pnpm --filter=@gameverse/types build
pnpm --filter=@gameverse/constants build
pnpm --filter=@gameverse/utils build
pnpm --filter=@gameverse/validation build
pnpm --filter=@gameverse/config build
pnpm --filter=@gameverse/auth build

# Build dashboard
pnpm --filter=@gameverse/dashboard build

# Push database schema
pnpm --filter=@gameverse/database db:push

# Seed database
pnpm --filter=@gameverse/database db:seed
```

### Start with PM2

```bash
# Start dashboard
pm2 start ecosystem.config.js --only gameverse-dashboard

# Save PM2 config
pm2 save

# Enable auto-start on reboot
pm2 startup
```

---

## 7. Deploy Bot (VPS)

### Same Server as Dashboard (Recommended)

The bot runs on the same VPS as the dashboard for lower latency.

```bash
# Build bot
cd /opt/gameverse
pnpm --filter=@gameverse/bot build

# Start with PM2
pm2 start ecosystem.config.js --only gameverse-bot

# Save PM2 config
pm2 save
```

### Separate Server (If needed)

Follow the same VPS setup as Dashboard, then:

```bash
# Clone and install
git clone https://github.com/your-org/gameverse.git .
pnpm install

# Configure env
cp .env.example .env
nano .env

# Build and start
pnpm --filter=@gameverse/database db:generate
pnpm --filter=@gameverse/bot build
pm2 start ecosystem.config.js --only gameverse-bot
pm2 save
pm2 startup
```

### systemd Service (Alternative to PM2)

```bash
# Create service file
cat > /etc/systemd/system/gameverse-bot.service << 'EOF'
[Unit]
Description=GameVerse Discord Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/gameverse
ExecStart=/usr/bin/node apps/bot/dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl daemon-reload
systemctl enable gameverse-bot
systemctl start gameverse-bot

# Check status
systemctl status gameverse-bot
```

---

## 8. Discord Developer Portal Setup

### 8.1 Create Application

1. Go to https://discord.com/developers/applications
2. Click "New Application" → Name it "GameVerse 2026"
3. Copy the **Application ID** → Set as `DISCORD_CLIENT_ID`

### 8.2 Bot Setup

1. Go to "Bot" tab
2. Click "Reset Token" → Copy token → Set as `DISCORD_BOT_TOKEN`
3. Under "Privileged Gateway Intents", enable:
   - ✅ **Server Members Intent**
   - ✅ **Message Content Intent**
4. Scroll down → "Save Changes"

### 8.3 OAuth2 Setup

1. Go to "OAuth2" → "General"
2. Copy **Client Secret** → Set as `DISCORD_CLIENT_SECRET`
3. Under "Redirects", add:
   - `https://dashboard.delhincr.fun/api/auth/callback/discord`
   - `http://localhost:3000/api/auth/callback/discord` (for local dev)
4. "Save Changes"

### 8.4 Bot Permissions

1. Go to "OAuth2" → "URL Generator"
2. Select scopes: `bot`, `applications.commands`
3. Select permissions:
   - Manage Roles
   - Send Messages
   - Use Slash Commands
   - Embed Links
   - Read Message History
4. Copy the generated URL → Open in browser → Add bot to your server

---

## 9. DNS Configuration

### For gameverse.delhincr.fun (Landing — Cloudflare Pages)

If using Cloudflare Pages with custom domain, DNS is auto-configured.

If managing DNS manually:

```
Type    Name                    Content               Proxy
CNAME   gameverse               <your-pages-domain>   DNS only (or Proxied)
```

### For dashboard.delhincr.fun (Dashboard — VPS)

```
Type    Name                    Content               Proxy
A       dashboard               <your-vps-ip>         DNS only
```

If using Cloudflare proxy:
```
Type    Name                    Content               Proxy
A       dashboard               <your-vps-ip>         Proxied
```

### Discord OAuth Redirects

After DNS propagation, add to Discord Developer Portal → OAuth2 → Redirects:
- `https://dashboard.delhincr.fun/api/auth/callback/discord`

---

## 10. SSL Certificates

### Option A: Cloudflare (Recommended)

If using Cloudflare proxy, SSL is automatic (Full or Full Strict mode).

### Option B: Let's Encrypt (Manual)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificates
certbot certonly --nginx -d gameverse.delhincr.fun -d dashboard.delhincr.fun

# Auto-renew
certbot renew --dry-run
```

### Option C: Nginx with SSL (Docker)

Certificates go in `deploy/nginx/ssl/`:
```
deploy/nginx/ssl/fullchain.pem
deploy/nginx/ssl/privkey.pem
```

---

## 11. PM2 Process Manager

### Start all services

```bash
pm2 start ecosystem.config.js
```

### Useful commands

```bash
# Status
pm2 status

# Logs
pm2 logs gameverse-dashboard
pm2 logs gameverse-bot

# Restart
pm2 restart gameverse-dashboard
pm2 restart gameverse-bot

# Stop
pm2 stop gameverse-dashboard

# Monitor
pm2 monit

# Save current process list
pm2 save

# Restore on reboot
pm2 startup
```

### Nginx Reverse Proxy

Copy `deploy/nginx/production.conf` to Nginx:

```bash
cp deploy/nginx/production.conf /etc/nginx/nginx.conf
nginx -t
systemctl reload nginx
```

---

## 12. Deploy Slash Commands

After the bot is running:

```bash
# Deploy guild-scoped commands (instant, for testing)
node apps/bot/dist/deploy-commands.js --guild

# Deploy global commands (takes up to 1 hour to propagate)
node apps/bot/dist/deploy-commands.js
```

Commands:
- `/register` — Register for the festival
- `/festival` — View festival info
- `/events` — List upcoming events

---

## 13. Health Checks

### Dashboard

```bash
curl -H "Authorization: Bearer YOUR_HEALTH_TOKEN" http://localhost:3000/api/health
```

### Bot

```bash
curl http://localhost:3001/healthz
curl http://localhost:3001/readyz
curl http://localhost:3001/metrics
```

### Automated health check

```bash
bash deploy/scripts/health-check.sh
```

---

## 14. Troubleshooting

### BetterAuthError: Failed to initialize database adapter

**Cause:** Schema mismatch between better-auth and Prisma models.

**Fix:** Ensure `packages/auth/src/server.ts` uses `prismaAdapter` with correct field mappings:

```typescript
database: prismaAdapter(prisma, { provider: "postgresql" }),
user: { modelName: "User", fields: { name: "username", image: "avatarUrl" } },
session: { modelName: "Session" },
account: { modelName: "Account", fields: { accessTokenExpiresAt: "tokenExpiresAt", accountId: "providerAccountId", providerId: "provider" } },
verification: { modelName: "VerificationToken", fields: { identifier: "userId" } },
```

### Discord bot: "Used disallowed intents"

**Fix:** Enable Privileged Gateway Intents in Discord Developer Portal → Bot → Privileged Gateway Intents:
- Server Members Intent ✅
- Message Content Intent ✅

### Port already in use

```bash
# Find process using port
netstat -ano | findstr :3000

# Kill it
taskkill /PID <pid> /F
```

### Database connection refused

1. Check `DATABASE_URL` in `.env`
2. Ensure Neon database is active (not paused)
3. Remove `channel_binding=require` from connection string
4. Test: `pnpm --filter=@gameverse/database db:push`

### Dashboard shows "Failed to load" on all pages

1. Check server logs: `pm2 logs gameverse-dashboard`
2. Verify `.env` is copied to `apps/dashboard/.env`
3. Verify all workspace packages are built: `pnpm build`

### Landing page shows blank on Cloudflare

1. Check build output directory is `apps/landing/dist`
2. Verify Node.js version is 20 in Cloudflare Pages settings
3. Check build logs for errors

---

## Quick Reference: Production Domains

| Service | URL | Hosting |
|---------|-----|---------|
| Landing | https://gameverse.delhincr.fun | Cloudflare Pages |
| Dashboard | https://dashboard.delhincr.fun | VPS (Hetzner/DigitalOcean) |
| Discord Bot | — | Same VPS as Dashboard |
| OAuth Callback | https://dashboard.delhincr.fun/api/auth/callback/discord | — |
| Database | Neon PostgreSQL | Neon Tech |
| Cache | Upstash Redis | Upstash |
| Storage | Backblaze B2 | Backblaze |
