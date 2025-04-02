#!/bin/bash
# rebuild-docker.sh

# Stop all containers
echo "Stopping all running containers..."
docker-compose down

# Remove containers
echo "Removing containers..."
docker rm -f $(docker ps -a -q) 2>/dev/null || true

# Remove images (optional - comment out if you want to keep images)
echo "Removing images..."
docker rmi $(docker images -q directorymonster*) 2>/dev/null || true

# Rebuild with no cache
echo "Rebuilding docker containers with no cache..."
docker-compose build --no-cache

# Start containers
echo "Starting containers..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check if containers are running
echo "Checking container status..."
docker-compose ps

# Check application logs
echo "Application logs:"
docker-compose logs app --tail=50

echo "Docker rebuild complete!"
