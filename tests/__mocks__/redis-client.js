/**
 * Redis Client Mock for Tests
 * 
 * This mock provides a comprehensive set of Redis functions for testing.
 */

// In-memory store for testing
const memoryStore = new Map();

// Transaction mock
const transactionCommands = [];
const transactionResults = [];

// Mock Redis client with all required functions
const redisMock = {
  // Basic operations
  get: jest.fn((key) => Promise.resolve(memoryStore.get(key) || null)),
  set: jest.fn((key, value) => {
    memoryStore.set(key, value);
    return Promise.resolve('OK');
  }),
  del: jest.fn((key) => {
    const existed = memoryStore.has(key);
    memoryStore.delete(key);
    return Promise.resolve(existed ? 1 : 0);
  }),
  keys: jest.fn((pattern) => {
    // Simple pattern matching for tests
    const keys = Array.from(memoryStore.keys());
    if (pattern === '*') return Promise.resolve(keys);
    
    // Basic wildcard support
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return Promise.resolve(keys.filter(key => regex.test(key)));
  }),
  
  // Expiration
  expire: jest.fn(() => Promise.resolve(1)),
  ttl: jest.fn(() => Promise.resolve(3600)),
  
  // Sets
  sadd: jest.fn(() => Promise.resolve(1)),
  srem: jest.fn(() => Promise.resolve(1)),
  smembers: jest.fn(() => Promise.resolve([])),
  sismember: jest.fn(() => Promise.resolve(0)),
  
  // Hashes
  hget: jest.fn(() => Promise.resolve(null)),
  hset: jest.fn(() => Promise.resolve(1)),
  hgetall: jest.fn(() => Promise.resolve({})),
  hdel: jest.fn(() => Promise.resolve(1)),
  
  // Lists
  lpush: jest.fn(() => Promise.resolve(1)),
  rpush: jest.fn(() => Promise.resolve(1)),
  lrange: jest.fn(() => Promise.resolve([])),
  
  // Transactions
  multi: jest.fn(() => {
    transactionCommands.length = 0;
    transactionResults.length = 0;
    
    return {
      get: jest.fn((key) => {
        transactionCommands.push(['get', key]);
        transactionResults.push(memoryStore.get(key) || null);
        return redisMock.multi();
      }),
      set: jest.fn((key, value) => {
        transactionCommands.push(['set', key, value]);
        transactionResults.push('OK');
        return redisMock.multi();
      }),
      del: jest.fn((key) => {
        transactionCommands.push(['del', key]);
        transactionResults.push(1);
        return redisMock.multi();
      }),
      sadd: jest.fn((key, ...members) => {
        transactionCommands.push(['sadd', key, ...members]);
        transactionResults.push(members.length);
        return redisMock.multi();
      }),
      srem: jest.fn((key, ...members) => {
        transactionCommands.push(['srem', key, ...members]);
        transactionResults.push(members.length);
        return redisMock.multi();
      }),
      hset: jest.fn((key, field, value) => {
        transactionCommands.push(['hset', key, field, value]);
        transactionResults.push(1);
        return redisMock.multi();
      }),
      exec: jest.fn(() => Promise.resolve(transactionResults)),
    };
  }),
  
  // Connection
  ping: jest.fn(() => Promise.resolve('PONG')),
};

// Key-value store interface
const kvMock = {
  get: jest.fn((key) => Promise.resolve(memoryStore.get(key) || null)),
  set: jest.fn((key, value) => {
    memoryStore.set(key, value);
    return Promise.resolve('OK');
  }),
  del: jest.fn((key) => {
    const existed = memoryStore.has(key);
    memoryStore.delete(key);
    return Promise.resolve(existed ? 1 : 0);
  }),
  keys: jest.fn((pattern) => {
    // Simple pattern matching for tests
    const keys = Array.from(memoryStore.keys());
    if (pattern === '*') return Promise.resolve(keys);
    
    // Basic wildcard support
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return Promise.resolve(keys.filter(key => regex.test(key)));
  }),
  expire: jest.fn(() => Promise.resolve(1)),
  ttl: jest.fn(() => Promise.resolve(3600)),
  
  // Transaction support
  multi: jest.fn(() => {
    return {
      exec: jest.fn(() => Promise.resolve([])),
    };
  }),
};

// Export the mock
module.exports = {
  redis: redisMock,
  kv: kvMock,
  
  // Helper to reset the mock state
  __resetMock: () => {
    memoryStore.clear();
    transactionCommands.length = 0;
    transactionResults.length = 0;
    
    // Reset all mock functions
    Object.values(redisMock).forEach(fn => {
      if (typeof fn === 'function' && fn.mockClear) {
        fn.mockClear();
      }
    });
    
    Object.values(kvMock).forEach(fn => {
      if (typeof fn === 'function' && fn.mockClear) {
        fn.mockClear();
      }
    });
  },
  
  // Helper to set mock data
  __setMockData: (key, value) => {
    memoryStore.set(key, value);
  },
};
