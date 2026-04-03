#!/bin/bash
# YourPage DB Backup Script
# Usage: ./backup.sh (or add to crontab)
# Crontab: 0 2 * * * /path/to/backup.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="yourpage_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Backup via docker
docker exec yourpage-postgres-1 pg_dump -U yourpage yourpage | gzip > "${BACKUP_DIR}/${FILENAME}"

# Keep only last 7 days
find "$BACKUP_DIR" -name "yourpage_*.sql.gz" -mtime +7 -delete

echo "Backup created: ${BACKUP_DIR}/${FILENAME}"
echo "Size: $(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)"
