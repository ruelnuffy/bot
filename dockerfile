# Start from the official node image
FROM node:16-slim

# Install necessary dependencies for Chromium
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

# Set Puppeteer to skip downloading Chromium and use the system one
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set the working directory inside the container
WORKDIR /app

# Copy package.json files to the container
COPY package*.json ./

# Install the production dependencies
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the necessary port (adjust if needed)
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
