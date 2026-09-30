# Storefront image: a Next.js 15 production build served by Node as an unprivileged user.
#
# Two of the values this app compiles into the client bundle - the API base URL and
# the canonical site URL - depend on the deployment, so they are required build
# arguments. A build that omits them fails here instead of shipping a bundle that
# silently calls http://localhost:5000.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
# Required: NEXT_PUBLIC_* values are inlined at build time and cannot be changed later.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
RUN test -n "$NEXT_PUBLIC_API_URL" || { echo "build arg NEXT_PUBLIC_API_URL is required (e.g. https://shop.example.com/api)" >&2; exit 1; }
RUN test -n "$NEXT_PUBLIC_SITE_URL" || { echo "build arg NEXT_PUBLIC_SITE_URL is required (e.g. https://shop.example.com)" >&2; exit 1; }
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
# node_modules come from the deps stage alone: .dockerignore keeps the developer host-platform install out of the build context.
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Runtime dependencies only: TypeScript, ESLint and Tailwind stay out of the image.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/next.config.mjs ./next.config.mjs
# Incremental rendering and the image cache write under .next/cache at runtime.
RUN mkdir -p /app/.next/cache && chown -R node:node /app/.next
# The unprivileged user shipped by the base image.
USER node
EXPOSE 3000
# The prerendered default-locale page answers without the API, so a 200 proves the server is serving.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/hy').then((r)=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"
# Exec form so Node is PID 1 and receives SIGTERM/SIGINT for a graceful shutdown.
CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
