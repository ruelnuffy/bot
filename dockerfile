FROM node:16-slim

# Install Chromium and required dependencies
RUN apt-get update && apt-get install -y \
  chromium-browser \
  libnss3 \
  libatk-1.0-0 \
  libxss1 \
  libgdk-pixbuf2.0-0 \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libxtst6 \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# Set the environment variable for Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory and install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# Install puppeteer-core and other dependencies
RUN npm install puppeteer-core

# Start the bot
CMD ["node", "index.js"]
