#!/bin/bash
# Backup script for student_db
# This script must be run on the host machine or inside a container with docker CLI

set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/student_db_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

CONTAINER_NAME="${DB_CONTAINER:-hethongqlsv_db}"
DB_PASS="${DB_PASSWORD:-rootpassword}"

echo "Starting database backup from ${CONTAINER_NAME} to ${BACKUP_FILE}..."

# Execute dump inside the db container
docker exec "${CONTAINER_NAME}" mysqldump -u root -p"${DB_PASS}" student_db > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully!"
    echo "File saved at: ${BACKUP_FILE}"
else
    echo "Error: Backup failed!"
    exit 1
fi
