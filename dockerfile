# syntax=docker/dockerfile:1.4
FROM node:18-bullseye-slim

# 1) Install Chromium and build tools
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    chromium \
    python3 \
    python3-dev \
    build-essential \
    libgtk-3-0 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# 2) Copy package files, install
COPY package*.json ./
RUN npm config set registry https://registry.npmjs.org/ \
 && npm install --omit=dev

# 3) Copy app
COPY . .

# 4) Prep session directory
RUN mkdir -p session

# 5) Start
CMD ["node","index.js"]
