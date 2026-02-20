# =============================================================================
# Stage 1: Build the React/Vite client
# =============================================================================
FROM oven/bun:1 AS client-builder
WORKDIR /app

# Build-time args – injected into the static bundle by Vite (cannot be changed at runtime)
ARG VITE_SEO_TITLE="Calendar"
ARG VITE_SEO_DESCRIPTION="Personal calendar"
ARG VITE_SEO_LANG="en"
ARG VITE_SEO_KEYWORDS="booking,calendar,appointments,self-hosted"
ARG VITE_SEO_AUTHOR="Calendar"
ARG VITE_SEO_OG_TYPE="website"
ARG VITE_SEO_TWITTER_CARD="summary"
ARG VITE_PUBLIC_URL=""
ARG VITE_VAPID_PUBLIC_KEY=""

# Expose build args as environment variables so Vite can read them
ENV VITE_SEO_TITLE=$VITE_SEO_TITLE \
    VITE_SEO_DESCRIPTION=$VITE_SEO_DESCRIPTION \
    VITE_SEO_LANG=$VITE_SEO_LANG \
    VITE_SEO_KEYWORDS=$VITE_SEO_KEYWORDS \
    VITE_SEO_AUTHOR=$VITE_SEO_AUTHOR \
    VITE_SEO_OG_TYPE=$VITE_SEO_OG_TYPE \
    VITE_SEO_TWITTER_CARD=$VITE_SEO_TWITTER_CARD \
    VITE_PUBLIC_URL=$VITE_PUBLIC_URL \
    VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

# Install root dependencies (layer-cached)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Install client dependencies (layer-cached)
COPY src/client/package.json src/client/bun.lock ./src/client/
RUN cd src/client && bun install --frozen-lockfile

# Copy full source and build the client bundle
COPY . .
RUN bun run build:client

# =============================================================================
# Stage 2: Production runtime
# =============================================================================
FROM oven/bun:1-slim AS production
WORKDIR /app

ENV NODE_ENV=production

# Install only production server dependencies
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Copy server source
COPY tsconfig.json ./
COPY src/server ./src/server

# Copy compiled client assets from the builder stage
COPY --from=client-builder /app/src/client/dist ./src/client/dist

# Create persistent data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["bun", "run", "src/server/index.ts"]
