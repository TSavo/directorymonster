#!/bin/bash
# Quick simple API test script for DirectoryMonster

echo "Testing DirectoryMonster simple API..."
echo "------------------------------"

# Test GET request
echo "Sending GET request to test endpoint..."
curl -X GET http://localhost:3000/api/test

echo -e "\n\nSending POST request to test endpoint..."
# Test POST request
curl -X POST \
  -H "Content-Type: application/json" \
  --data '{"test":"data"}' \
  http://localhost:3000/api/test

echo -e "\n\n------------------------------"
echo "Simple API test completed"