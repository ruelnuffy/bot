# Use an Ubuntu base image for more flexibility with packages
FROM ubuntu:20.04

# Set environment variables for Puppeteer (to avoid downloading Chromium automatically)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install necessary dependencies (Chromium, fonts, and others needed by Puppeteer)
RUN apt-get update && apt-get install -y \
    chromium-browser \
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
    && rm -rf /var/lib/apt/lists/*

# Set working directory in the container
WORKDIR /app

# Copy your application code into the container
COPY . /app

# Install all dependencies defined in package.json
RUN npm install

# Expose the port the app will run on
EXPOSE 3000

# Set the default command to run the app
CMD ["npm", "start"]
