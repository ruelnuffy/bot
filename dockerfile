# syntax=docker/dockerfile:1.4
FROM node:18-slim

# install chromium and dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      chromium \
      libnss3 \
      libatk-bridge2.0-0 \
      libgtk-3-0 \
      libx11-xcb1 \
      libxcomposite1 \
      libxdamage1 \
      libxrandr2 \
      libgbm1 \
      libpango-1.0-0 \
      libasound2 \
      fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# persistent session store
RUN mkdir -p ./session

CMD ["node", "index.js"]
