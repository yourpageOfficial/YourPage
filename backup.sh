#!/bin/bash
# YourPage DB Backup Script
# Usage: ./backup.sh (or add to crontab)
# Crontab: 0 2 * * * /path/to/backup.sh

set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="yourpage_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Backup via docker
docker exec yourpage-postgres pg_dump -U yourpage yourpage | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "Backup created: ${BACKUP_DIR}/${FILENAME}"
echo "Size: $(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)"

# Upload to GCS if gsutil available
if command -v gsutil &> /dev/null && [ -n "${GCS_BACKUP_BUCKET:-}" ]; then
  gsutil cp "${BACKUP_DIR}/${FILENAME}" "gs://${GCS_BACKUP_BUCKET}/db-backups/${FILENAME}"
  echo "Uploaded to gs://${GCS_BACKUP_BUCKET}/db-backups/${FILENAME}"
fi

# Keep only last 7 days locally
find "$BACKUP_DIR" -name "yourpage_*.sql.gz" -mtime +7 -delete
echo "Old backups cleaned (>7 days)"
