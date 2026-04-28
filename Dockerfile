FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY server ./server

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server/index.js"]
