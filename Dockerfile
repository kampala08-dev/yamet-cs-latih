# yamet-cs-latih: tahap 1 build Vite, tahap 2 jalankan server Node tipis.
# Dipakai di mesin yang bisa `docker build`. Hostinger Docker Manager TIDAK menjalankan build:
# di sana pakai docker-compose.yml (builder clone repo), lihat README-deploy.md.
FROM node:20-bookworm-slim AS bangun
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && npm prune --omit=dev && rm -f server/*.test.mjs

FROM node:20-bookworm-slim
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY --from=bangun /src/package.json ./
COPY --from=bangun /src/node_modules ./node_modules
COPY --from=bangun /src/dist ./dist
COPY --from=bangun /src/server ./server
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/sehat').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.mjs"]
