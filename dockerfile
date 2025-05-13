# Use the official Node.js image with Debian as base (more complete base than Alpine)
FROM node:lts-buster

# Install Chromium and its dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    libxss1 \
    libgtk-3-0 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set the working directory inside the container
WORKDIR /app

# Copy all project files into the container
COPY . /app

# Install the app's dependencies
RUN npm install

# Expose port 3000 (or the port your app uses)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
