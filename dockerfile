#######################################################################
# Venille WhatsApp bot – production container
# • Uses the official Puppeteer image so ALL Chrome deps are pre‑installed
# • No apt‑get, no missing‑lib surprises (libatk, libnss, …)
#######################################################################

# ── 1. Base image ────────────────────────────────────────────────────
#   - Node 22‑slim + system Chromium + non‑root user `pptr`
#     https://github.com/puppeteer/puppeteer/pkgs/container/puppeteer
FROM ghcr.io/puppeteer/puppeteer:22.1.0

# ── 2. App files & production deps only ──────────────────────────────
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev           # faster & reproducible
COPY . .

# ── 3. Tell whatsapp‑web.js / puppeteer to reuse the built‑in Chrome ─
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ── 4. Run the bot as the non‑root user that already exists in image ─
USER pptr
CMD ["node", "index.js"]
