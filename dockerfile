# syntax=docker/dockerfile:1.4
FROM node:18-slim

# install only what Puppeteer’s Chromium needs + build-tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      libnss3 \
      libatk-bridge2.0-0 \
      libx11-xcb1 \
      libgtk-3-0 \
      libxcomposite1 \
      libxdamage1 \
      libxrandr2 \
      libgbm1 \
      libasound2 \
      fonts-liberation \
      python3 \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# copy & install
COPY package*.json ./
RUN npm install --omit=dev

# copy code + make session dir
COPY . .
RUN mkdir -p session

CMD ["node", "index.js"]
