# ---- build: CLI + server (tsup) and Angular web app ----
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json tsconfig.json tsup.config.ts ./
COPY src ./src
RUN npm ci && npm run build:cli

COPY web/package.json web/package-lock.json ./web/
RUN npm --prefix web ci
COPY web/angular.json web/tsconfig.json web/tsconfig.app.json web/proxy.conf.json ./web/
COPY web/src ./web/src
COPY web/public ./web/public
RUN npm run build:web

# ---- runtime: slim server serving API + built Angular app ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/web/dist ./web/dist

EXPOSE 3000
CMD ["node", "dist/server.js"]
