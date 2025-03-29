/**
 * Clear Users Script
 * 
 * This script clears all users from the database.
 * It's useful for testing the first user setup flow.
 */

const path = require('path');
// Adjust the path to correctly find the redis-client module
const redisClientPath = path.resolve(__dirname, '../src/lib/redis-client');
const { clearUsers } = require(redisClientPath);

async function main() {
  console.log('Clearing all users from the database...');
  
  try {
    await clearUsers();
    console.log('Users cleared successfully');
  } catch (error) {
    console.error('Error clearing users:', error);
    process.exit(1);
  }
  
  // Small delay to ensure connections are closed properly
  setTimeout(() => {
    console.log('Done');
    process.exit(0);
  }, 1000);
}

main();
