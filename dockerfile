# Use Ubuntu base image instead of Alpine for more complete package support
FROM ubuntu:20.04

# Set environment variables to skip Chromium download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Update and install necessary dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libxss1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    fonts-liberation \
    ttf-freefont \
    nss \
    freetype \
    harfbuzz \
    cairo \
    pango \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy the application code to the container
COPY . /app

# Install the app dependencies
RUN npm install

# Expose the port your application will use
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
