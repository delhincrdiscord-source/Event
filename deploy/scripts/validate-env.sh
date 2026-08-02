#!/bin/bash
# ====================================================
# Gameverse 2026 — Environment Validator
# ====================================================
# Validates all required environment variables are set.
# Run before any deployment: bash deploy/scripts/validate-env.sh
# ====================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

errors=0

check_required() {
    local var_name="$1"
    local description="$2"
    if [ -z "${!var_name:-}" ]; then
        echo -e "${RED}✗ MISSING${NC} $var_name — $description"
        errors=$((errors + 1))
    else
        echo -e "${GREEN}✓ SET${NC}    $var_name"
    fi
}

check_optional() {
    local var_name="$1"
    local description="$2"
    if [ -z "${!var_name:-}" ]; then
        echo -e "${YELLOW}○ OPTIONAL${NC} $var_name — $description"
    else
        echo -e "${GREEN}✓ SET${NC}    $var_name"
    fi
}

echo "=====================================================" echo"  Gameverse 2026 — Environment Validation" echo"=====================================================" echo""

# Load .env if it exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
    echo -e "${GREEN}Loaded .env${NC}"
else
    echo -e "${RED}No .env file found. Copy .env.example to .env and fill in values.${NC}"
    exit 1
fi

echo "" echo"--- Required Variables ---" check_required"DATABASE_URL""PostgreSQL connection string" check_required"BETTER_AUTH_SECRET" "64-char random string for session signing"
check_required "BETTER_AUTH_URL" "Dashboard URL (e.g. https://dashboard.delhincr.fun)"
check_required "DISCORD_CLIENT_ID""Discord OAuth app client ID" check_required"DISCORD_CLIENT_SECRET""Discord OAuth app client secret" check_required"DISCORD_GUILD_ID""Discord server/guild ID" check_required"DISCORD_BOT_TOKEN""Discord bot token" check_required"UPSTASH_REDIS_REST_URL""Upstash Redis REST URL" check_required"UPSTASH_REDIS_REST_TOKEN""Upstash Redis REST token" check_required"TOKEN_ENCRYPTION_KEY" "64-char hex key (32 bytes) for AES-256-GCM"
check_required "ADMIN_EMAIL""Initial admin user email" check_required"ADMIN_PASSWORD" "Initial admin user password (min 8 chars)"
check_required "HEALTH_ENDPOINT_TOKEN" "Token for authenticated health endpoints"

echo "" echo"--- Optional Variables ---" check_optional"NEXT_PUBLIC_LANDING_URL" "Landing page URL (default: https://gameverse.delhincr.fun)"
check_optional "NEXT_PUBLIC_DASHBOARD_URL" "Dashboard URL (default: https://dashboard.delhincr.fun)"
check_optional "HEALTH_PORT" "Bot health port (default: 3001)"
check_optional "LOG_LEVEL" "Log level (default: info)"

echo ""
if [ $errors -gt 0 ]; then
    echo -e "${RED}Validation failed: $errors required variable(s) missing.${NC}"
    echo "Fix the above issues and re-run: bash deploy/scripts/validate-env.sh"
    exit 1
else
    echo -e "${GREEN}All required variables are set.${NC}"
fi
