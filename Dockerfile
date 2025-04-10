FROM node:18-slim

# Install required packages
RUN apt-get update && \
    apt-get install -y git python3 build-essential curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with legacy-peer-deps to bypass conflicts
RUN npm ci --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000
ENV WATCHPACK_POLLING=true

# Expose port for the API
EXPOSE 3000

# Use the correct script from package.json
CMD ["npm", "run", "app:dev:docker"]
