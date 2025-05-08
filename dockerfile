# syntax=docker/dockerfile:1.4
FROM node:18-bullseye-slim

# 1) Install OS‐level libraries for headless Chromium + build tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      fonts-liberation \
      chromium \
      chromium-driver \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libcups2 \
      libdrm2 \
      libxdamage1 \
      libxkbcommon0 \
      libxcomposite1 \
      libxrandr2 \
      libgbm1 \
      libasound2 \
      libpangocairo-1.0-0 \
      libgtk-3-0 \
      libnss3 \
      libxshmfence1 \
    # build essentials for better-sqlite3 and node-gyp
      python3 \
      python3-dev \
      build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# 2) Copy package manifests and install deps from the public registry
COPY package*.json ./
RUN npm config set registry https://registry.npmjs.org/ && \
    npm install --omit=dev

# 3) Copy your bot’s source
COPY . .

# 4) Ensure session folder exists for LocalAuth persistence
RUN mkdir -p ./session

# 5) Launch your bot
CMD ["npm", "start"]
