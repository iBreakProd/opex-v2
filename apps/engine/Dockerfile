FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/engine/package.json ./apps/engine/
COPY packages/db/package.json ./packages/db/
COPY packages/redis/package.json ./packages/redis/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile

COPY apps/engine ./apps/engine
COPY packages/db ./packages/db
COPY packages/redis ./packages/redis
COPY packages/types ./packages/types
COPY packages/typescript-config ./packages/typescript-config

RUN pnpm --filter @repo/db build && \
  pnpm --filter @repo/redis build && \
  pnpm --filter engine build

FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/engine/package.json ./apps/engine/
COPY packages/db/package.json ./packages/db/
COPY packages/redis/package.json ./packages/redis/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/engine/dist ./apps/engine/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/redis/dist ./packages/redis/dist
COPY --from=builder /app/packages/types/src ./packages/types/src

ENV NODE_ENV=production

CMD ["node", "apps/engine/dist/index.js"]
