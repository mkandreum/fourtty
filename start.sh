#!/bin/sh

# Seed the database or run migrations
echo "Running database schema sync..."
npx prisma db push --accept-data-loss

# Start the application
echo "Starting application..."
node dist/index.js
