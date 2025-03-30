// Mock Redis client for testing

// Create a mock store for in-memory Redis operations
const mockStore = new Map<string, any>();

// Simple Redis mock implementation
export const redis = {
  // Basic operations
  async get(key: string) {
    return mockStore.get(key);
  },
  async set(key: string, value: any) {
    mockStore.set(key, value);
    return 'OK';
  },
  async del(...keys: string[]) {
    let count = 0;
    for (const key of keys) {
      if (mockStore.delete(key)) count++;
    }
    return count;
  },
  async keys(pattern: string) {
    const wildcard = pattern.includes('*');
    const prefix = pattern.replace('*', '');
    
    return Array.from(mockStore.keys()).filter(k => 
      wildcard ? k.startsWith(prefix) : k === pattern
    );
  },
  
  // Set operations
  async sadd(key: string, ...values: any[]) {
    if (!mockStore.has(key)) {
      mockStore.set(key, new Set());
    }
    const set = mockStore.get(key);
    let added = 0;
    for (const value of values) {
      const size = set.size;
      set.add(value);
      if (set.size > size) added++;
    }
    return added;
  },
  async smembers(key: string) {
    if (!mockStore.has(key)) return [];
    return Array.from(mockStore.get(key));
  },
  async srem(key: string, ...members: string[]) {
    if (!mockStore.has(key)) return 0;
    const set = mockStore.get(key);
    let removed = 0;
    for (const member of members) {
      if (set.delete(member)) removed++;
    }
    return removed;
  },
  
  // Utility
  async ping() {
    return 'PONG';
  }
};

// Simple KV-like interface for compatibility
export const kv = {
  async get<T>(key: string) {
    const value = mockStore.get(key);
    if (!value) return null;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e) {
      return value as unknown as T;
    }
  },
  
  async set(key: string, value: any) {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    mockStore.set(key, serializedValue);
  },
  
  async del(key: string) {
    mockStore.delete(key);
  },
  
  async keys(pattern: string) {
    const wildcard = pattern.includes('*');
    const prefix = pattern.replace('*', '');
    
    return Array.from(mockStore.keys()).filter(k => 
      wildcard ? k.startsWith(prefix) : k === pattern
    );
  },
};

// Utility to clear all users
export const clearUsers = async () => {
  const userKeys = Array.from(mockStore.keys()).filter(k => k.startsWith('user:'));
  for (const key of userKeys) {
    mockStore.delete(key);
  }
};
