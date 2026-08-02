# Delhi NCR Gameverse 2026 — Architecture

## Overview

This is a production-ready monorepo for the Delhi NCR Gameverse 2026 community festival platform. The architecture supports 100,000+ users with a hybrid approach combining Astro for the marketing site and Next.js for the application dashboard.

## Tech Stack

| Layer | Technology | Deployment |
|-------|-----------|------------|
| Marketing Website | Astro 5 | Cloudflare Pages |
| Application Dashboard | Next.js 15 App Router | Vercel |
| Backend | Next.js Route Handlers + Server Actions | Vercel |
| Database | PostgreSQL + Prisma | Neon/Supabase |
| Authentication | Better Auth | - |
| Storage | Cloudflare R2 | - |
| Cache | Upstash Redis | - |

## Monorepo Structure

```
gameverse/
├── apps/
│   ├── landing/          # Astro 5 marketing site
│   └── dashboard/        # Next.js 15 application
├── packages/
│   ├── ui/               # Shared React components
│   ├── database/         # Prisma schema & client
│   ├── auth/             # Better Auth configuration
│   ├── types/            # Shared TypeScript types
│   ├── validation/       # Zod validation schemas
│   ├── utils/            # Shared utilities
│   ├── constants/        # App constants & config
│   ├── config/           # ESLint & Prettier configs
│   └── tsconfig/         # Shared TypeScript configs
├── turbo.json            # Turborepo configuration
├── pnpm-workspace.yaml   # pnpm workspace config
└── package.json          # Root package.json
```

## Package Dependencies

```
@gameverse/dashboard
├── @gameverse/auth
├── @gameverse/database
├── @gameverse/ui
├── @gameverse/types
├── @gameverse/utils
├── @gameverse/validation
└── @gameverse/constants

@gameverse/landing
├── @gameverse/types
└── @gameverse/constants

@gameverse/auth
└── @gameverse/database

@gameverse/database
└── (no internal dependencies)

@gameverse/ui
└── (no internal dependencies, uses React)

@gameverse/types
└── (no internal dependencies)

@gameverse/validation
└── (no internal dependencies, uses Zod)

@gameverse/utils
└── (no internal dependencies)

@gameverse/constants
└── (no internal dependencies)
```

## Import Conventions

```typescript
// Relative imports within same package
import { Button } from "./button";

// Cross-package imports
import { Button } from "@gameverse/ui";
import { prisma } from "@gameverse/database/client";
import { auth } from "@gameverse/auth/server";
import type { User, Event } from "@gameverse/types";
import { formatDate } from "@gameverse/utils";
import { createEventSchema } from "@gameverse/validation";
import { APP_CONFIG } from "@gameverse/constants";
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Run all apps in development
pnpm dev

# Run specific app
pnpm dev:landing
pnpm dev:dashboard

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Type check all packages
pnpm typecheck

# Database commands
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database
pnpm db:studio      # Open Prisma Studio
pnpm db:migrate:dev # Create migration
```

## Environment Variables

See `.env.example` files in:
- Root: `/.env.example`
- Dashboard: `/apps/dashboard/.env.example`
- Landing: `/apps/landing/.env.example`

## Coding Standards

- **TypeScript**: Strict mode enabled
- **Imports**: Use `type` imports for type-only imports
- **Components**: Forward refs for all interactive components
- **Validation**: Zod schemas for all API inputs
- **Naming**: `snake_case` for database, `camelCase` for TypeScript
- **Error Handling**: Consistent API response envelope

## Build Strategy

1. **Turborepo** orchestrates builds with dependency awareness
2. **Packages** build before apps (via `^build` dependency)
3. **Database** generates Prisma client first
4. **Apps** consume built packages for production

## Deployment

### Landing (Cloudflare Pages)
```bash
cd apps/landing
pnpm build
# Deploy dist/ to Cloudflare Pages
```

### Dashboard/API (Vercel)
```bash
cd apps/dashboard
pnpm build
# Deploy to Vercel with root directory set to apps/dashboard
```

## Database Migrations

Follow the Expand-Contract strategy:
1. **Expand**: Add new columns as nullable
2. **Migrate**: Deploy app to write to new columns
3. **Contract**: Remove old columns in next release
