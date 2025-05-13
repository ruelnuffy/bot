FROM node:lts-alpine

# Install necessary dependencies
RUN apk update && apk add --no-cache \
    libxss \
    libgdk-pixbuf \
    cairo \
    pango \
    libgtk-3-0 \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set environment variable to allow Puppeteer to download Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

WORKDIR /app
COPY . /app

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
