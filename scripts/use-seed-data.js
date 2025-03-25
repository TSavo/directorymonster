// This script exports the in-memory Redis store from the seed script
// for use by the application during development

// Import the seed data script
const seedDataScript = require('./seed-data');

// Export the memory store for use by the application
module.exports = {
  memoryStore: seedDataScript.memoryStore,
  redis: seedDataScript.redis
};