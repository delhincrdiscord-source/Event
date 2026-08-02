#!/bin/bash
# ====================================================
# Gameverse 2026 — Production Startup Script
# ====================================================
# Usage: bash deploy/scripts/start.sh [pm2|docker|dev]
# ====================================================

set -euo pipefail

MODE="${1:-pm2}"
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

cd "$ROOT_DIR"

echo "====================================================="
echo "  Delhi NCR Gameverse 2026 — Starting ($MODE)"
echo "====================================================="

case "$MODE" in
    pm2)
        echo "Starting with PM2..."
        mkdir -p logs

        # Validate environment
        bash deploy/scripts/validate-env.sh || exit 1

        # Generate Prisma client
        echo "Generating Prisma client..."
        pnpm db:generate

        # Run migrations
        echo "Running database migrations..."
        pnpm db:migrate:deploy

        # Seed database
        echo "Seeding database..."
        pnpm db:seed || echo "Seed completed (or data already exists)"

        # Build all packages
        echo "Building packages..."
        pnpm build

        # Stop existing processes
        pm2 delete gameverse-dashboard gameverse-bot 2>/dev/null || true

        # Start services
        pm2 start ecosystem.config.js

        echo ""
        echo "Services started:"
        pm2 list
        ;;

    docker)
        echo "Starting with Docker Compose..."
        bash deploy/scripts/validate-env.sh || exit 1
        docker compose up -d --build
        echo ""
        echo "Services starting. Check with: docker compose logs -f"
        ;;

    dev)
        echo "Starting in development mode..."
        pnpm dev
        ;;

    *)
        echo "Usage: $0 [pm2|docker|dev]"
        exit 1
        ;;
esac

echo ""
echo "====================================================="
echo "  Gameverse 2026 is running!"
echo "====================================================="
echo ""
echo "  Landing:   http://localhost:4321"
echo "  Dashboard: http://localhost:3000"
echo "  Bot:       http://localhost:3001/healthz"
echo ""
