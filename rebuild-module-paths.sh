#!/bin/bash

echo "========================================"
echo "DirectoryMonster Module Path Rebuild Tool"
echo "========================================"
echo

echo "1. Rebuilding component exports..."
node scripts/rebuild-component-exports.js
if [ $? -ne 0 ]; then
  echo "Error rebuilding component exports"
  exit 1
fi

echo
echo "2. Stopping Docker containers..."
docker-compose down
if [ $? -ne 0 ]; then
  echo "Error stopping Docker containers"
  exit 1
fi

echo
echo "3. Rebuilding Docker containers..."
docker-compose build --no-cache
if [ $? -ne 0 ]; then
  echo "Error rebuilding Docker containers"
  exit 1
fi

echo
echo "4. Starting Docker containers..."
docker-compose up -d
if [ $? -ne 0 ]; then
  echo "Error starting Docker containers"
  exit 1
fi

echo
echo "5. Creating test sites..."
node scripts/create-test-sites.js
if [ $? -ne 0 ]; then
  echo "Error creating test sites"
  exit 1
fi

echo
echo "========================================"
echo "Module path rebuild complete!"
echo "========================================"
echo
echo "You can now check if the Docker containers are working correctly by:"
echo "1. Running the E2E tests: npm run test:e2e"
echo "2. Visiting http://localhost:3000/admin/sites"
echo
echo "If you still see module resolution errors:"
echo "1. Check the container logs: docker-compose logs app"
echo "2. Try updating import paths to use relative imports"
echo "3. Verify Docker volumes are mounted correctly"
echo

echo "Press any key to exit..."
read -n 1
