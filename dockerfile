FROM node:lts-alpine

RUN apk update && apk add --no-cache \
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
    && rm -rf /var/cache/apk/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app
COPY . /app
RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
