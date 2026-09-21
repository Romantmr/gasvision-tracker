# syntax=docker/dockerfile:1
#
# Multi-stage build for GasVision Трекер.
#
# We intentionally do NOT use Next.js "standalone" output: this app uses a
# Prisma driver adapter (better-sqlite3, a native addon) and runs
# `prisma migrate deploy` / `prisma db seed` at container startup via tsx,
# both of which need the full `node_modules` (and the Prisma CLI) present
# at runtime. Keeping the full install avoids fragile dependency-tracing
# around native binaries in exchange for a larger image.

ARG NODE_VERSION=22

################################################################################
# base: shared OS packages for every stage
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
  && rm -rf /var/lib/apt/lists/*

################################################################################
# deps: install npm dependencies (needs build tools to compile better-sqlite3)
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json .npmrc ./
RUN npm ci

################################################################################
# builder: generate the Prisma client and build the Next.js app
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

################################################################################
# runner: minimal runtime image
FROM base AS runner
ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /data \
  && chown nextjs:nodejs /data

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts
# The Prisma-generated client lives under src/generated (gitignored, built by
# `prisma generate`); the seed script imports it directly via a relative
# path with tsx, so it must exist on disk at runtime, not just inside .next.
COPY --from=builder /app/src/generated ./src/generated

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
VOLUME ["/data"]

ENTRYPOINT ["entrypoint.sh"]
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
