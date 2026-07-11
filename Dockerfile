# =============================================================================
# PERSONAL CONTEXT SYSTEM - Production Dockerfile
# =============================================================================
# Multi-stage build for optimized production image.
# Based on: https://github.com/vercel/next.js/blob/canary/examples/with-docker
# Mirrors the proven pattern used by the sibling dharma-calendar deployment
# (same Prisma 7 prisma-client generator + @prisma/adapter-pg setup).
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:26.4.0-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:26.4.0-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma 7 resolves DATABASE_URL even during 'generate' (no DB connection needed).
# A placeholder value is enough — the real URL is injected at runtime via docker-compose.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" node_modules/.bin/prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm run build

# -----------------------------------------------------------------------------
# Stage 3: Runner (Production)
# -----------------------------------------------------------------------------
FROM node:26.4.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone build output (includes only necessary node_modules).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma client and schema (needed for runtime migrations via the `migrate` service).
# Prisma 7 prisma-client generator outputs to src/generated/prisma/ (bundled by Next.js
# standalone tracing); @prisma packages and dotenv (used by prisma.config.ts) are copied
# explicitly since tracing doesn't always pick up their dynamic requires.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv

COPY --chmod=755 scripts/docker-entrypoint.sh /docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Under Compose the app service healthcheck is authoritative — keep values in sync
# with docker-compose.yml (interval 30s / timeout 5s / retries 3 / start 45s).
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Migrations run in the separate compose `migrate` service (prisma migrate deploy),
# gated before the app via depends_on: service_completed_successfully.
ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["node", "server.js"]
