# ── 构建阶段 ──
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ src/
COPY prisma/ prisma/
RUN npx prisma generate
RUN npm run build

# ── 运行阶段 ──
FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
EXPOSE 3001

# 启动时先跑迁移再启动服务
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
