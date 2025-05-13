# Use the official Node image as base
FROM node:16-slim

# Install dependencies for Puppeteer (Chromium)
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    chromium \
    --no-install-recommends

# Set the working directory
WORKDIR /app

# Install npm dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Set the executable path to Puppeteer's bundled Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Start your application
CMD ["npm", "start"]
