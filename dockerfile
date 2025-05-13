# Use an official Node.js runtime as a parent image
FROM node:16-slim

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install necessary dependencies for Puppeteer
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
    && rm -rf /var/lib/apt/lists/*

# Download and install a custom Chromium binary
RUN wget https://github.com/puppeteer/puppeteer/releases/download/v10.0.0/puppeteer-v10.0.0-linux-x64.tar.bz2 \
    && tar -xvjf puppeteer-v10.0.0-linux-x64.tar.bz2 \
    && mv puppeteer-v10.0.0-linux-x64/chrome-linux/chrome /usr/bin/chromium \
    && rm -rf puppeteer-v10.0.0-linux-x64 puppeteer-v10.0.0-linux-x64.tar.bz2

# Copy the rest of your application code
COPY . .

# Expose the port your app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
