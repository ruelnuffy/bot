# ---- 1. base image ---------------------------------------------------------
# Use the current LTS “slim” image; keeps the final size small
FROM node:22-slim

# ---- 2. Chromium & system deps --------------------------------------------
ENV DEBIAN_FRONTEND=noninteractive

# Instruct puppeteer‑core NOT to download its own Chromium copy
# and tell it where the system Chromium binary will be.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      chromium \
      # puppeteer / chrome runtime deps
      ca-certificates \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcups2 \
      libdrm2 \
      libgbm1 \
      libgtk-3-0 \
      libnss3 \
      libx11-xcb1 \
      libxcomposite1 \
      libxdamage1 \
      libxrandr2 \
      libxss1 \
      libxtst6 \
      fonts-liberation \
      libgl1-mesa-glx \
      libxshmfence1 \
    ; \
    # clean up apt cache
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*

# ---- 3. create app directory ----------------------------------------------
WORKDIR /app

# ---- 4. install npm deps (production) -------------------------------------
COPY package*.json ./
RUN npm ci --omit=dev

# ---- 5. copy rest of the code ---------------------------------------------
COPY . .

# ---- 6. drop privs to non‑root --------------------------------------------
USER node

# ---- 7. start your bot ----------------------------------------------------
CMD ["node", "index.js"]
