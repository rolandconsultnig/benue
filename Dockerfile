# ==========================================
# CEWERS Multi-stage Production Dockerfile
# ==========================================

# 1. Base image for common dependencies
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# 2. Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
COPY packages/console/package.json ./packages/console/
COPY packages/ussd/package.json ./packages/ussd/
# Mobile is excluded as it's built separately via Expo EAS
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 3. Builder stage
FROM dependencies AS builder
COPY . .
# Generate Prisma Client
RUN pnpm --filter @cewers/api prisma:generate
# Build shared, api, and console
RUN pnpm -r run build

# 4. Production API Image
FROM node:20-alpine AS api-runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/package.json ./packages/api/
COPY --from=builder /app/packages/api/prisma ./packages/api/prisma
EXPOSE 4000
CMD ["node", "packages/api/dist/main.js"]

# 5. Production Console (Nginx) Image
FROM nginx:alpine AS console-runner
COPY --from=builder /app/packages/console/dist /usr/share/nginx/html
COPY packages/console/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
