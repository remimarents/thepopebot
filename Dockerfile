FROM node:20-bookworm-slim

# Installer nødvendige systemverktøy (ps ligger i procps)
RUN apt-get update && apt-get install -y \
    procps \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Kopier package-filer først
COPY package*.json ./

# Installer dependencies
RUN npm install

# Kopier resten av prosjektet
COPY . .

# Installer PM2 globalt
RUN npm install -g pm2

# Start server via PM2
CMD ["pm2-runtime", "server.js"]
