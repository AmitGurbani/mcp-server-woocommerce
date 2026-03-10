FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN pnpm run build

FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod

COPY --from=builder /app/build ./build

ENV WORDPRESS_SITE_URL=""
ENV WOOCOMMERCE_CONSUMER_KEY=""
ENV WOOCOMMERCE_CONSUMER_SECRET=""
ENV WORDPRESS_USERNAME=""
ENV WORDPRESS_APP_PASSWORD=""

ENTRYPOINT ["node", "build/index.js"]
