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
  sadd: jest.fn((key, ...members) => {
    if (!memoryStore.has(key)) {
      memoryStore.set(key, new Set());
    }
    const set = memoryStore.get(key);
    let added = 0;
    for (const member of members) {
      const size = set.size;
      set.add(member);
      if (set.size > size) added++;
    }
    return Promise.resolve(added);
  }),
  srem: jest.fn((key, ...members) => {
    if (!memoryStore.has(key)) return Promise.resolve(0);
    const set = memoryStore.get(key);
    let removed = 0;
    for (const member of members) {
      if (set.delete(member)) removed++;
    }
    return Promise.resolve(removed);
  }),
  smembers: jest.fn((key) => {
    if (!memoryStore.has(key)) return Promise.resolve([]);
    return Promise.resolve(Array.from(memoryStore.get(key)));
  }),
  sismember: jest.fn((key, member) => {
    if (!memoryStore.has(key)) return Promise.resolve(0);
    const set = memoryStore.get(key);
    return Promise.resolve(set.has(member) ? 1 : 0);
  }),
  
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
    
    const transaction = {
      get: jest.fn(() => transaction),
      set: jest.fn(() => transaction),
      del: jest.fn(() => transaction),
      sadd: jest.fn(() => transaction),
      srem: jest.fn(() => transaction),
      smembers: jest.fn(() => transaction),
      hset: jest.fn(() => transaction),
      exec: jest.fn(() => Promise.resolve([[null, 'OK'], [null, 'OK']])),
    };
    
    return transaction;
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
  
  // Set operations
  sadd: jest.fn((key, ...members) => {
    if (!memoryStore.has(key)) {
      memoryStore.set(key, new Set());
    }
    const set = memoryStore.get(key);
    let added = 0;
    for (const member of members) {
      const size = set.size;
      set.add(member);
      if (set.size > size) added++;
    }
    return Promise.resolve(added);
  }),
  srem: jest.fn((key, ...members) => {
    if (!memoryStore.has(key)) return Promise.resolve(0);
    const set = memoryStore.get(key);
    let removed = 0;
    for (const member of members) {
      if (set.delete(member)) removed++;
    }
    return Promise.resolve(removed);
  }),
  smembers: jest.fn((key) => {
    if (!memoryStore.has(key)) return Promise.resolve([]);
    return Promise.resolve(Array.from(memoryStore.get(key)));
  }),
  sismember: jest.fn((key, member) => {
    if (!memoryStore.has(key)) return Promise.resolve(0);
    const set = memoryStore.get(key);
    return Promise.resolve(set.has(member) ? 1 : 0);
  }),
  
  // Transaction support
  multi: jest.fn(() => {
    const transaction = {
      get: jest.fn(() => transaction),
      set: jest.fn(() => transaction),
      del: jest.fn(() => transaction),
      sadd: jest.fn(() => transaction),
      srem: jest.fn(() => transaction),
      smembers: jest.fn(() => transaction),
      exec: jest.fn(() => Promise.resolve([[null, 'OK'], [null, 'OK']])),
    };
    return transaction;
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
