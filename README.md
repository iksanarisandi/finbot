# FinBot - Telegram Financial Bot

Bot Telegram untuk mencatat pengeluaran/pemasukan dengan natural language.

## Features

- 📝 **Catat Transaksi**: Ketik langsung seperti `20k makan siang`
- 💰 **Pemasukan**: Gunakan prefix `+` atau keyword seperti "gaji", "bonus"
- 📊 **Rekap**: Lihat rekap harian, mingguan, bulanan
- 📜 **History**: Kelola riwayat transaksi
- ⭐ **Pro Plan**: 200 catatan/bulan dengan pembayaran QRIS

## Tech Stack

- Node.js 20+
- Telegraf 4.x (Telegram Bot Framework)
- PostgreSQL 16
- Prisma ORM
- Docker & Docker Compose

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations (requires PostgreSQL running)
npx prisma migrate dev

# Start in polling mode
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
BOT_TOKEN=your_bot_token
ADMIN_IDS=your_telegram_id
DATABASE_URL=postgresql://user:pass@localhost:5432/finbot
WEBHOOK_DOMAIN=https://your-domain.com  # Leave empty for polling mode
```

## Docker Deployment

```bash
# Build and start with Docker Compose
docker-compose up -d

# Run migrations
docker exec -it finbot npx prisma migrate deploy

# View logs
docker-compose logs -f finbot
```

## Commands

### User Commands
| Command | Description |
|---------|-------------|
| `/start` | Register/welcome |
| `/help` | Show help |
| `/today` | Today's summary |
| `/week` | Last 7 days summary |
| `/month` | This month's summary |
| `/history` | Recent transactions |
| `/delete <id>` | Delete transaction |
| `/plan` | View plans |
| `/upgrade` | Upgrade to Pro |
| `/status` | Account status |

### Admin Commands
| Command | Description |
|---------|-------------|
| `/stats` | System statistics |
| `/confirm <user_id> pro <months>` | Confirm payment |
| `/reject <user_id> [reason]` | Reject payment |
| `/downgrade <user_id>` | Downgrade to Free |

## Deployment to Dokploy

1. Push to GitHub
2. Connect repository in Dokploy
3. Set environment variables
4. Enable HTTPS with Let's Encrypt
5. Deploy

See [Deployment Guide](DEPLOYMENT.md) for detailed instructions.

## License

ISC
