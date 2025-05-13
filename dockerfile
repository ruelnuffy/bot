FROM node:16-slim

# Install Chromium and dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    ca-certificates \
    libatk-1.0-0 \
    libatk-bridge2.0-0 \
    libappindicator3-1 \
    libasound2 \
    libnspr4 \
    libnss3 \
    libxss1 \
    libgdk-pixbuf2.0-0 \
    libgbm1 \
    libx11-xcb1 \
    libsecret-1-0 \
    libxcomposite1 \
    libxrandr2 \
    libxtst6 \
    xdg-utils \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer skip download and use local chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

USER node

CMD ["npm", "start"]
