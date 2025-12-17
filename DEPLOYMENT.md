# Deployment Guide - FinBot

## Prerequisites

- VPS with Dokploy installed
- Domain pointed to VPS (e.g., `finbot.akses.digital`)
- GitHub repository

## Step 1: Cloudflare DNS Setup

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pilih domain `akses.digital`
3. Klik **DNS** di sidebar
4. Klik **Add Record**
5. Isi:
   - **Type**: `A`
   - **Name**: `finbot`
   - **IPv4 address**: `[IP VPS ANDA]`
   - **Proxy status**: **DNS Only** (grey cloud) ⚠️ PENTING!
   - **TTL**: Auto
6. Klik **Save**

> ⚠️ **PENTING**: Proxy HARUS dimatikan (grey cloud). Telegram webhook butuh direct connection.

### Verify DNS
```bash
nslookup finbot.akses.digital
# Harus return IP VPS Anda
```

## Step 2: Push ke GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: FinBot MVP"

# Add remote (ganti dengan repo Anda)
git remote add origin https://github.com/username/finbot.git

# Push
git push -u origin main
```

## Step 3: Setup di Dokploy

1. Login ke Dokploy dashboard
2. Klik **Create New Application**
3. Pilih **Docker Compose**
4. Connect GitHub repository
5. Pilih branch `main`

### Environment Variables

Set di Dokploy dashboard:

| Variable | Value |
|----------|-------|
| `BOT_TOKEN` | `8576459660:AAHKXH39iht-Y8Ih--DUamMaOU7ukpow_bE` |
| `ADMIN_IDS` | `5787181924` |
| `POSTGRES_PASSWORD` | `your_secure_password_here` |
| `WEBHOOK_DOMAIN` | `https://finbot.akses.digital` |
| `WEBHOOK_PATH` | `/webhook` |
| `PRO_PRICE` | `25000` |

### Domain Configuration

1. Di Dokploy, buka app settings
2. Add domain: `finbot.akses.digital`
3. Enable **HTTPS** dengan Let's Encrypt
4. Set port ke `3000`

## Step 4: Deploy

1. Klik **Deploy** di Dokploy
2. Tunggu build selesai

### Initialize Database

Setelah deploy pertama, run migrations:

```bash
# SSH ke VPS atau gunakan Dokploy terminal
docker exec -it finbot npx prisma migrate deploy
```

## Step 5: Verify

1. Buka `https://finbot.akses.digital/health`
   - Harus return: `{"status":"ok",...}`

2. Buka Telegram, cari bot Anda
3. Kirim `/start`
4. Coba catat transaksi: `10k makan`

## Troubleshooting

### Webhook tidak bekerja
```bash
# Check webhook status
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

### Database error
```bash
# Check logs
docker-compose logs finbot

# Reset database (HATI-HATI: hapus semua data!)
docker exec -it finbot npx prisma migrate reset
```

### Bot tidak merespon
1. Check apakah container running: `docker ps`
2. Check logs: `docker-compose logs -f finbot`
3. Pastikan BOT_TOKEN benar

## Maintenance

### View Logs
```bash
docker-compose logs -f finbot
```

### Restart Bot
```bash
docker-compose restart finbot
```

### Update Bot
```bash
git pull
docker-compose up -d --build
```

### Backup Database
```bash
docker exec finbot-postgres pg_dump -U finbot finbot > backup.sql
```
