# Use Node.js LTS Alpine image as base
FROM node:lts-alpine

# Set the working directory inside the container
WORKDIR /app

# Install Chromium and necessary dependencies
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    libxss \
    libxcomposite \
    libxdamage \
    libxrandr \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    cairo \
    pango \
    libgtk-3-0 \
    fonts-liberation \
    && rm -rf /var/cache/apk/*

# Set environment variables for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy the app code to the container
COPY . .

# Expose the port for the app
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
