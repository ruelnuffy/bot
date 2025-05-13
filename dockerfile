# Use an official Node.js runtime as a parent image
FROM node:lts-alpine

# Set the working directory inside the container
WORKDIR /app

# Install Chromium and dependencies
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

# Set environment variables to avoid Puppeteer downloading Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
