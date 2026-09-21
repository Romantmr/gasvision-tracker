#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

if [ -z "$AUTH_SECRET" ]; then
  echo "ERROR: AUTH_SECRET is not set. Generate one with: openssl rand -base64 32" >&2
  exit 1
fi

echo "→ Applying database migrations..."
npx prisma migrate deploy

echo "→ Seeding default columns (idempotent, safe to re-run)..."
npx prisma db seed

echo "→ Starting GasVision Трекер..."
exec "$@"
