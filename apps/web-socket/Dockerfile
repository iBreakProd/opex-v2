FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web-socket/package.json ./apps/web-socket/
COPY packages/redis/package.json ./packages/redis/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile

COPY apps/web-socket ./apps/web-socket
COPY packages/redis ./packages/redis
COPY packages/typescript-config ./packages/typescript-config

RUN pnpm --filter @repo/redis build && \
  pnpm --filter web-socket build

FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web-socket/package.json ./apps/web-socket/
COPY packages/redis/package.json ./packages/redis/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/web-socket/dist ./apps/web-socket/dist
COPY --from=builder /app/packages/redis/dist ./packages/redis/dist

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "apps/web-socket/dist/index.js"]
