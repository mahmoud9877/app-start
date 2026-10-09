# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- development: Vite dev server with hot reload ----
FROM deps AS development
COPY . .
# Dev runs as `node` (see docker-compose.override.yml); Vite writes its
# dependency cache into node_modules/.vite.
RUN chown -R node:node /app/node_modules
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---- build: static files in dist/ ----
FROM deps AS build
# Baked in at build time: must match the backend's DEPLOYMENT_MODE.
ARG VITE_DEPLOYMENT_MODE=saas
ENV VITE_DEPLOYMENT_MODE=$VITE_DEPLOYMENT_MODE
COPY . .
RUN npm run build

# ---- production: nginx serves the app and proxies /api to the backend ----
FROM nginx:1.27-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
