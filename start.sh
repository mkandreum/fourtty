#!/bin/sh

# Sync database schema (using db push for SQLite/Dev environments)
echo "Syncing database schema..."
npx prisma db push --accept-data-loss

# Generate prisma client just in case
npx prisma generate

# Start the application
echo "Starting application..."
node dist/index.js
