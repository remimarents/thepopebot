FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y python3 make g++

RUN apt-get update && apt-get install -y \
    procps \
    curl \
    git \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /project

# Copy entire project first (needed for thepopebot imports)
COPY . .

# Install root dependencies so thepopebot package is available
RUN npm install

# Install PM2 globally
RUN npm install -g pm2

# Install web app dependencies and build Next.js
WORKDIR /project/web
RUN npm install && npm run build

# Save .next to a backup location in case the volume mount hides it
RUN cp -r .next /tmp/next-backup

# Return to project root
WORKDIR /project

# Start script that restores .next if missing due to volume mount and changes to web dir
RUN echo '#!/bin/bash\nset -e\nif [ ! -d "/project/web/.next" ] && [ -d "/tmp/next-backup" ]; then\n  echo "Restoring .next from backup..."\n  mkdir -p /project/web\n  cp -r /tmp/next-backup /project/web/.next\nfi\necho "Starting server from /project/web..."\ncd /project/web\nexec pm2-runtime server.js' > /start.sh && chmod +x /start.sh

# Start the Next.js app via PM2
CMD ["/start.sh"]
