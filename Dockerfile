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
ENV MCP_TRANSPORT=""
ENV PORT=""
ENV MCP_PORT="3000"
ENV MCP_AUTH_TOKEN=""
ENV AUTH0_DOMAIN=""
ENV AUTH0_AUDIENCE=""
ENV MCP_SERVER_URL=""
ENV WOOCOMMERCE_MCP_READ_ONLY=""

EXPOSE 3000

ENTRYPOINT ["node", "build/index.js"]
