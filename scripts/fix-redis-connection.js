/**
 * Script to fix Redis connection in Docker
 * This creates a bypass for the real Redis connection in the Docker environment
 */

const fs = require('fs');
const path = require('path');

// Path to the redis-client.ts file
const redisClientPath = path.join(process.cwd(), 'src/lib/redis-client.ts');

// Read the current file content
console.log(`Reading file: ${redisClientPath}`);
const content = fs.readFileSync(redisClientPath, 'utf8');

// Replace the in-memory fallback flag
const updatedContent = content.replace(
  'const USE_MEMORY_FALLBACK = true;',
  'const USE_MEMORY_FALLBACK = process.env.NODE_ENV !== "development";'
);

// Write the updated content back to the file
console.log('Writing updated content...');
fs.writeFileSync(redisClientPath, updatedContent, 'utf8');

console.log('Redis client configuration updated successfully!');
console.log('Please rebuild and restart the Docker container.');
