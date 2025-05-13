# Use Alpine as base image
FROM node:lts-alpine

# Add additional repositories to fetch missing dependencies
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
    apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    libxss \
    libgdk-pixbuf \
    cairo \
    pango \
    libgtk-3-0 \
    libnss3 \
    libcups2 \
    libxss1 \
    && rm -rf /var/cache/apk/*

# Puppeteer will use the default Chromium if no executablePath is set
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Set working directory and copy application files
WORKDIR /app
COPY . /app

# Install dependencies
RUN npm install

# Expose the app's port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
