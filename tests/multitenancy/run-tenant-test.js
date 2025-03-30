// Simple test runner for TenantService
const { TenantService } = require('../../src/lib/tenant/tenant-service');

// Mock Redis for testing
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  sadd: jest.fn(),
  srem: jest.fn(),
  smembers: jest.fn(),
};

// Mock the Redis client
jest.mock('../../src/lib/redis-client', () => ({
  redis: mockRedis,
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  },
}));

// Tests for TenantService
async function runTests() {
  console.log('Testing TenantService normalizeHostname functionality:');
  
  // Test hostname normalization
  const testCases = [
    { input: 'example.com', expected: 'example.com' },
    { input: 'www.example.com', expected: 'example.com' },
    { input: 'EXAMPLE.com', expected: 'example.com' },
    { input: 'http://example.com', expected: 'example.com' },
    { input: 'https://example.com', expected: 'example.com' },
    { input: 'https://www.example.com/', expected: 'example.com' },
    { input: 'example.com:3000', expected: 'example.com' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const { input, expected } of testCases) {
    const result = TenantService.normalizeHostname(input);
    if (result === expected) {
      console.log(`✅ ${input} -> ${result}`);
      passed++;
    } else {
      console.log(`❌ ${input} -> ${result} (expected ${expected})`);
      failed++;
    }
  }
  
  console.log(`\nTests completed: ${passed} passed, ${failed} failed`);
}

// Run the tests
runTests();