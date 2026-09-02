# syntax=docker/dockerfile:1

# Pinned for reproducible builds; Dependabot keeps the version current.
# The alpine variant is ~43MB instead of ~450MB for the default image.
FROM oven/bun:1.4.0-alpine AS deps
WORKDIR /app

# Only the manifest and lockfile, so this layer is cached until they change
COPY package.json bun.lock ./
# --frozen-lockfile fails loudly instead of silently resolving new versions
RUN bun install --frozen-lockfile --production && mkdir -p node_modules

FROM oven/bun:1.4.0-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json ./
COPY server.ts health.ts ./
COPY src ./src

# Drop root: the image ships with an unprivileged `bun` user
USER bun

EXPOSE 6464

# Validates the Plex tokens, so keep this infrequent to stay within Plex limits
HEALTHCHECK --interval=3h --timeout=35s --start-period=10s --retries=3 \
	CMD ["bun", "run", "health.ts"]

CMD ["bun", "run", "server.ts"]
