#!/bin/bash

# Clear all user data from Redis for testing the first user setup
# This script uses Docker commands to directly access the Redis container

# Set container name (default is directorymonster-redis-1)
CONTAINER=${1:-directorymonster-redis-1}

echo "Clearing all users from Redis container: $CONTAINER"

# Get all keys with the "user:" prefix
USER_KEYS=$(docker exec $CONTAINER redis-cli KEYS "user:*")

if [ -z "$USER_KEYS" ]; then
  echo "No user keys found. Database is already clean."
  exit 0
fi

echo "Found user keys:"
echo "$USER_KEYS"

# Delete each key individually for better error handling
for KEY in $USER_KEYS; do
  echo "Deleting key: $KEY"
  docker exec $CONTAINER redis-cli DEL "$KEY"
done

# Verify deletion
REMAINING=$(docker exec $CONTAINER redis-cli KEYS "user:*")
if [ -z "$REMAINING" ]; then
  echo "Successfully cleared all user data."
else
  echo "WARNING: Some user keys remain: $REMAINING"
  exit 1
fi

echo "Redis is now ready for first user setup testing."
