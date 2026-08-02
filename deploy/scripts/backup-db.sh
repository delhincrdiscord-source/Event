#!/bin/bash
# ====================================================
# Gameverse 2026 — Database Backup Script
# ====================================================
# Usage: bash deploy/scripts/backup-db.sh
# Schedule via cron: 0 2 * * * /path/to/backup-db.sh
# ====================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

# Load .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
else
    echo "Error: No .env file found"
    exit 1
fi

BACKUP_DIR="$ROOT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gameverse_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR" echo"[$(date)] Starting database backup..."

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/dbname
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\2|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|://[^:]*:\([^@]*\)@.*|\1|p')

PGPASSWORD="$DB_PASS"pg_dump -h"$DB_HOST" -p"$DB_PORT" -U"$DB_USER" -d"$DB_NAME" \
    --no-owner \
    --no-privileges \
    | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup completed: $BACKUP_FILE ($FILESIZE)"

# Retain only last 30 backups
cd "$BACKUP_DIR"
ls -t gameverse_*.sql.gz | tail -n +31 | xargs -r rm --
REMAINING=$(ls gameverse_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date)] Retained $REMAINING backup(s)"

echo "[$(date)] Backup done."
