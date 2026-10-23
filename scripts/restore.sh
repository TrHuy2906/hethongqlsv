#!/bin/bash
# Restore script for student_db
# Usage: ./scripts/restore.sh <path_to_backup_file>

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_backup_file>"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file '${BACKUP_FILE}' does not exist!"
    exit 1
fi

echo "WARNING: This will overwrite the current database."
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 1
fi

CONTAINER_NAME="${DB_CONTAINER:-hethongqlsv_db}"
DB_PASS="${DB_PASSWORD:-rootpassword}"

echo "Restoring database to ${CONTAINER_NAME} from ${BACKUP_FILE}..."

# Execute restore inside the db container
cat "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" mysql -u root -p"${DB_PASS}" student_db

if [ $? -eq 0 ]; then
    echo "Restore completed successfully!"
else
    echo "Error: Restore failed!"
    exit 1
fi
