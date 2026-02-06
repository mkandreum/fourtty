#!/bin/sh

# Seed the database or run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting application..."
node dist/index.js
