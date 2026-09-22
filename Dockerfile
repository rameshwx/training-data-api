FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY db ./db
COPY public ./public
COPY openapi.json ./openapi.json

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

USER node
CMD ["sh", "-c", "node src/db/migrate.js && node src/server.js"]
