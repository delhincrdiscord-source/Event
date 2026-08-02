# Delhi NCR GameVerse Festival 2026

A production-ready community festival management platform for 100K+ gamers across the Delhi NCR region.

## Architecture

| App | Stack | Domain |
|-----|-------|--------|
| **Landing** | Astro 7 + Tailwind CSS v4 | [gameverse.delhincr.fun](https://gameverse.delhincr.fun) |
| **Dashboard** | Next.js 15 App Router | [dashboard.delhincr.fun](https://dashboard.delhincr.fun) |
| **Bot** | Discord.js v14 | — |
| **Database** | PostgreSQL (Neon) + Prisma | — |
| **Auth** | Better Auth (Discord OAuth) | — |
| **Cache** | Upstash Redis | — |
| **Storage** | Backblaze B2 | — |

## Monorepo Structure

```
├── apps/
│   ├── landing/          # Astro static site
│   ├── dashboard/        # Next.js admin + participant dashboard
│   └── bot/              # Discord bot (registration, moderation, sync)
├── packages/
│   ├── database/         # Prisma schema, client, migrations, seeds
│   ├── auth/             # Better Auth configuration
│   ├── ui/               # Shared UI components (shadcn/ui based)
│   ├── types/            # Shared TypeScript types
│   ├── utils/            # Shared utilities (crypto, format, storage, redis)
│   ├── validation/       # Zod schemas
│   ├── constants/        # App config, event types, role names
│   ├── config/           # Shared tsconfig, logger
│   └── tsconfig/         # Shared TypeScript configs
├── deploy/               # Docker, Nginx, PM2, health checks
└── turbo.json            # Turborepo pipeline config
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
pnpm --filter=@gameverse/database db:generate

# Run database migrations
pnpm --filter=@gameverse/database db:push

# Seed database
pnpm --filter=@gameverse/database db:seed

# Start development servers
pnpm dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps for production |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:seed` | Seed database with roles, permissions, admin user |

## Production URLs

- **Landing**: https://gameverse.delhincr.fun
- **Dashboard**: https://dashboard.delhincr.fun
- **Discord OAuth Callback**: https://dashboard.delhincr.fun/api/auth/callback/discord

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth session encryption key |
| `DISCORD_CLIENT_ID` | Discord OAuth app ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth app secret |
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `DISCORD_GUILD_ID` | Target Discord server ID |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |
| `B2_KEY_ID` | Backblaze B2 key ID |
| `B2_APP_KEY` | Backblaze B2 app key |
| `B2_BUCKET_NAME` | Backblaze B2 bucket name |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

## License

[MIT](./LICENSE)
