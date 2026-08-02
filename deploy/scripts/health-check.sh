#!/bin/bash
# ====================================================
# Gameverse 2026 — Health Check Script
# ====================================================
# Checks all services are healthy.
# Usage: bash deploy/scripts/health-check.sh
# ====================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

errors=0

check_service() {
    local name="$1"
    local url="$2"
    local auth_header="${3:-}"

    local args=(-s -o /dev/null -w "%{http_code}" --max-time 5)
    if [ -n "$auth_header" ]; then
        args+=(-H "Authorization: Bearer $auth_header")
    fi

    status=$(curl "${args[@]}" "$url" 2>/dev/null || echo "000")

    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓${NC} $name (HTTP $status)"
    else
        echo -e "${RED}✗${NC} $name (HTTP $status)"
        errors=$((errors + 1))
    fi
}

echo "====================================================="
echo "  Gameverse 2026 — Health Checks"
echo "====================================================="
echo ""

# Load .env if exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

check_service "Dashboard" "http://localhost:3000"
check_service "Dashboard Login" "http://localhost:3000/login"
check_service "Landing" "http://localhost:4321"
check_service "Bot /healthz" "http://localhost:3001/healthz"

if [ -n "${HEALTH_ENDPOINT_TOKEN:-}" ]; then
    check_service "Bot /readyz" "http://localhost:3001/readyz" "$HEALTH_ENDPOINT_TOKEN"
    check_service "Bot /metrics" "http://localhost:3001/metrics" "$HEALTH_ENDPOINT_TOKEN"
else
    echo -e "${RED}⚠${NC} Skipped authenticated endpoints (HEALTH_ENDPOINT_TOKEN not set)"
fi

echo ""
if [ $errors -gt 0 ]; then
    echo -e "${RED}$errors service(s) are down.${NC}"
    exit 1
else
    echo -e "${GREEN}All services are healthy.${NC}"
fi
