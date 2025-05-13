FROM node:lts-alpine

# Add edge/testing repository for additional dependencies
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
    apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    libxss \
    cairo \
    pango \
    libatk1.0-0 \
    libgtk-3-0 \
    libgdk-pixbuf \
    libnss3 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    fonts-liberation \
    && rm -rf /var/cache/apk/*

# Set environment variable to skip Chromium download if it's not available
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true 

# Set working directory
WORKDIR /app

# Copy project files
COPY . /app

# Install dependencies
RUN npm install

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
