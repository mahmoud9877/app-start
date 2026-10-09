# ---- base: Prisma's engines need OpenSSL, which Alpine doesn't ship ----
FROM node:22-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

# ---- deps: install all dependencies (shared by development + build) ----
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ---- development: runs the source with `nest start --watch` (hot reload) ----
FROM deps AS development
ENV NODE_ENV=development
COPY . .
RUN npm run generate
EXPOSE 3000
CMD ["sh", "-c", "npm run generate && npm run migrate:central && npm run start:dev"]

# ---- build: compiles the app to dist/ ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- production: prod deps + compiled output + what runtime migrations need ----
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
# prisma (the CLI) is a production dependency: provisioning a tenant runs
# `prisma migrate deploy` at runtime.
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY prisma ./prisma
USER node
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/central/schema.prisma && node dist/main"]
