# ───────── Dockerfile ─────────
FROM node:22-bookworm-slim          # Debian, smaller than full node:22

# Puppeteer/Chromium deps
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive \
    apt-get install -y --no-install-recommends \
        chromium \                      # main browser
        fonts-liberation \
        libatk-1.0-0 libatk-bridge2.0-0 \
        libcups2 libdbus-1-3 libdrm2 \
        libgbm1 libgtk-3-0 libnss3 \
        libx11-xcb1 libxcomposite1 \
        libxdamage1 libxrandr2 \
        libxss1 libxtst6 ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Tell puppeteer to skip its own download and use the distro Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["node","index.js"]
