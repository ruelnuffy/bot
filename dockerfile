#######################################################################
# Venille WhatsApp bot – prod image (Chromium already baked in)
#######################################################################

FROM ghcr.io/puppeteer/puppeteer:22.1.0  

# ── env FIRST so npm ci sees it ──────────────────────────────────────
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# -------- install only prod deps --------
COPY package*.json ./
RUN npm ci --omit=dev     # reproducible & fast

# -------- app source --------
COPY . .

# run as the non‑root user that already exists in the base image
USER pptr
CMD ["node", "index.js"]
