#!/bin/bash
# Install missing dependencies directly in the Docker container

# Create variables for container names
REDIS_CONTAINER=directorymonster-redis-1
APP_CONTAINER=directorymonster-app-1

# Start containers if not running
docker-compose up -d

# Wait until app container is ready
echo "Waiting for containers to start..."
sleep 5

# Check if containers are running
if [ "$(docker ps -q -f name=${APP_CONTAINER})" ]; then
  echo "App container is running. Installing dependencies..."
  
  # Install missing packages
  docker exec -it ${APP_CONTAINER} npm install uuid jsonwebtoken --save
  docker exec -it ${APP_CONTAINER} npm install --global uuid jsonwebtoken
  
  # Restart the container to apply changes
  docker-compose restart app
  
  echo "Dependencies installed and container restarted!"
else
  echo "Error: App container is not running!"
  exit 1
fi
