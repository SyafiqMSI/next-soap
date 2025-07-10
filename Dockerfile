FROM node:18-alpine AS base

RUN apk add --no-cache mysql-client

FROM base AS soap-server
WORKDIR /app/server

COPY package*.json ./

RUN npm install

COPY server/ ./

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app/server
USER nodejs

FROM base AS frontend
WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app
USER nodejs

RUN npm run build

FROM base AS final
WORKDIR /app

COPY --from=soap-server /app/server ./server
COPY --from=frontend /app/.next ./.next
COPY --from=frontend /app/public ./public
COPY --from=frontend /app/package*.json ./

RUN npm ci --only=production

COPY start.sh ./
RUN chmod +x start.sh

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 30000 9720

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9720/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["sh", "./start.sh"]