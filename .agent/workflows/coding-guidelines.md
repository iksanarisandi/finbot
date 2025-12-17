---
description: Guidelines for AI coding in FinBot project to prevent common errors
---

# FinBot Project - AI Coding Guidelines

## Project Structure Reference

```
src/
├── index.js                    # Entry point
├── bot/
│   ├── index.js                # Bot initialization
│   ├── commands/               # User commands
│   │   ├── start.js
│   │   ├── help.js
│   │   └── admin/              # Admin commands (subfolder!)
│   │       ├── confirm.js
│   │       ├── reject.js
│   │       └── stats.js
│   └── handlers/
│       ├── transaction.js
│       └── photo.js
├── middleware/
│   └── security.js
├── services/
│   ├── userService.js
│   ├── transactionService.js
│   ├── paymentService.js
│   └── reminderService.js
└── utils/
    ├── parser.js
    ├── formatter.js
    └── messages.js
```

## Import Path Rules

### From `src/bot/commands/` (1 level in bot):
```javascript
// To services: ../../services/
const { x } = require('../../services/userService');

// To utils: ../../utils/
const { y } = require('../../utils/formatter');

// To middleware: ../../middleware/
const { z } = require('../../middleware/security');
```

### From `src/bot/commands/admin/` (2 levels in bot):
```javascript
// To services: ../../../services/
const { x } = require('../../../services/userService');

// To utils: ../../../utils/
const { y } = require('../../../utils/formatter');

// To middleware: ../../../middleware/
const { z } = require('../../../middleware/security');
```

### From `src/bot/handlers/`:
```javascript
// To services: ../../services/
const { x } = require('../../services/userService');
```

### From `src/index.js`:
```javascript
// To bot: ./bot
const { createBot } = require('./bot');

// To services: ./services/
const { x } = require('./services/reminderService');
```

## Pre-Push Checklist

Before pushing changes:

1. **Verify import paths** - Count folder depth carefully
2. **Run `npm install`** - If package.json changed
3. **Commit package-lock.json** - If dependencies changed
4. **Test locally if possible** - `node src/index.js` (will fail without DB but shows import errors)

## Common Mistakes to Avoid

1. **Wrong import depth from admin/ folder**
   - ❌ `../../services/` (2 levels - WRONG from admin/)
   - ✅ `../../../services/` (3 levels - CORRECT from admin/)

2. **Forgetting to update package-lock.json**
   - After adding new dependency, run `npm install` before push

3. **Using reserved filenames**
   - Avoid names that conflict with Node.js built-ins

4. **Inconsistent casing**
   - Use camelCase for files: `userService.js`, `testReminder.js`

## Database Changes

When adding new fields to Prisma schema:

1. Update `prisma/schema.prisma`
2. Create migration file in `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql`
3. After deploy, run: `docker exec -it finbot npx prisma migrate deploy`

## Testing After Deploy

```bash
# Check container is running
docker ps | grep finbot

# Check logs for errors
docker logs finbot --tail 30

# Check health endpoint
curl https://finbot.chatbotumkm.com/health

# Check webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```
