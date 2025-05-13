# Use a non-Alpine version of Node.js to avoid missing dependencies
FROM node:16

# Install Chromium and dependencies
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
    && rm -rf /var/lib/apt/lists/*

# Set environment variable to skip Chromium download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Set the working directory
WORKDIR /app
COPY . /app

# Install dependencies
RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
