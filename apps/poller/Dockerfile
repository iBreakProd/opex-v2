FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/poller/package.json ./apps/poller/
COPY packages/redis/package.json ./packages/redis/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile

COPY apps/poller ./apps/poller
COPY packages/redis ./packages/redis
COPY packages/types ./packages/types
COPY packages/typescript-config ./packages/typescript-config

RUN pnpm --filter @repo/redis build && \
  pnpm --filter poller build

FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/poller/package.json ./apps/poller/
COPY packages/redis/package.json ./packages/redis/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/poller/dist ./apps/poller/dist
COPY --from=builder /app/packages/redis/dist ./packages/redis/dist
COPY --from=builder /app/packages/types/src ./packages/types/src

ENV NODE_ENV=production

CMD ["node", "apps/poller/dist/index.js"]
