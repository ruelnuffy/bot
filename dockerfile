FROM node:18-slim

# Install required dependencies for Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && mkdir -p /etc/apt/sources.list.d \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Create a non-root user and switch to it for security
RUN groupadd -r whatsappbot && useradd -r -g whatsappbot -G audio,video whatsappbot \
    && mkdir -p /home/whatsappbot/Downloads \
    && chown -R whatsappbot:whatsappbot /home/whatsappbot \
    && chown -R whatsappbot:whatsappbot /usr/src/app

USER whatsappbot

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Set environment variables placeholder
# These will be provided by Koyeb during deployment
ENV SUPA_URL="https://ooycvetypklqvwtqubtn.supabase.co"
ENV SUPA_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWN2ZXR5cGtscXZ3dHF1YnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4OTg1NzksImV4cCI6MjA2MjQ3NDU3OX0.U6OzdJTS5U4p_zGP5R8sSScOqX4WZGMUi78dkl0_2zo"
ENV SUPA_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWN2ZXR5cGtscXZ3dHF1YnRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njg5ODU3OSwiZXhwIjoyMDYyNDc0NTc5fQ.Ea-WQ_O7nepg5pLh9acUZDSsdZp43M-LWkj9x2oekIo"
# Expose any ports your app needs (if applicable)
# EXPOSE 8080

# Start the bot
CMD ["node", "index.js"]
