/**
 * Redis client for key-value storage
 */
class RedisClient {
  private store: Map<string, { value: any, expiry?: number }>;
  private transactionLocks: Map<string, boolean>;
  private transactionQueue: Array<() => Promise<void>>;
  public transactionCount: number = 0;

  constructor() {
    console.log('Created global in-memory Redis store');
    this.store = new Map();
    this.transactionLocks = new Map();
    this.transactionQueue = [];
    this.transactionCount = 0;
    console.log('Using in-memory Redis with 0 keys');
  }

  /**
   * Set a key-value pair in the store
   *
   * @param key The key
   * @param value The value
   * @param expiry Optional expiry time in seconds
   * @returns Promise that resolves when the operation is complete
   */
  async set<T>(key: string, value: T, expiry?: number): Promise<void> {
    // Check if the key is locked in a transaction
    if (this.transactionLocks.get(key)) {
      throw new Error(`Key ${key} is locked in a transaction`);
    }

    const expiryMs = expiry ? Date.now() + expiry * 1000 : undefined;
    this.store.set(key, { value, expiry: expiryMs });
  }

  /**
   * Get a value from the store
   *
   * @param key The key
   * @returns Promise that resolves with the value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);

    if (!item) {
      return null;
    }

    // Check if the item has expired
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Delete a key from the store
   *
   * @param key The key
   * @returns Promise that resolves when the operation is complete
   */
  async del(key: string): Promise<void> {
    // Check if the key is locked in a transaction
    if (this.transactionLocks.get(key)) {
      throw new Error(`Key ${key} is locked in a transaction`);
    }

    this.store.delete(key);
  }

  /**
   * Get all keys matching a pattern
   *
   * @param pattern The pattern to match
   * @returns Promise that resolves with an array of keys
   */
  async keys(pattern: string): Promise<string[]> {
    console.log(`[MemoryRedis] Searching for keys matching pattern: ${pattern}`);
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keys: string[] = [];

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        keys.push(key);
      }
    }

    return keys;
  }

  /**
   * Clear the store
   *
   * @returns Promise that resolves when the operation is complete
   */
  async flushAll(): Promise<void> {
    this.store.clear();
    this.transactionLocks.clear();
    this.transactionQueue = [];
  }

  /**
   * Start a transaction
   *
   * @returns A transaction object
   */
  multi(): Transaction {
    this.transactionCount++;
    console.log(`Starting transaction #${this.transactionCount}`);
    return new Transaction(this);
  }

  /**
   * Lock a key for a transaction
   *
   * @param key The key to lock
   */
  lockKey(key: string): void {
    this.transactionLocks.set(key, true);
  }

  /**
   * Unlock a key after a transaction
   *
   * @param key The key to unlock
   */
  unlockKey(key: string): void {
    this.transactionLocks.delete(key);
  }

  /**
   * Queue a transaction operation
   *
   * @param operation The operation to queue
   */
  queueOperation(operation: () => Promise<void>): void {
    this.transactionQueue.push(operation);
  }

  /**
   * Execute all queued operations
   *
   * @returns Promise that resolves when all operations are complete
   */
  async executeQueue(): Promise<void> {
    const operations = [...this.transactionQueue];
    this.transactionQueue = [];

    for (const operation of operations) {
      await operation();
    }
  }
}

/**
 * Transaction class for Redis operations
 */
class Transaction {
  private client: RedisClient;
  private operations: Array<() => Promise<void>>;
  private lockedKeys: Set<string>;

  constructor(client: RedisClient) {
    this.client = client;
    this.operations = [];
    this.lockedKeys = new Set();
  }

  /**
   * Add a set operation to the transaction
   *
   * @param key The key
   * @param value The value
   * @param expiry Optional expiry time in seconds
   * @returns The transaction object for chaining
   */
  set<T>(key: string, value: T, expiry?: number): Transaction {
    this.lockedKeys.add(key);
    this.operations.push(async () => {
      await this.client.set(key, value, expiry);
    });
    return this;
  }

  /**
   * Add a delete operation to the transaction
   *
   * @param key The key
   * @returns The transaction object for chaining
   */
  del(key: string): Transaction {
    this.lockedKeys.add(key);
    this.operations.push(async () => {
      await this.client.del(key);
    });
    return this;
  }

  /**
   * Execute the transaction
   *
   * @returns Promise that resolves when the transaction is complete
   */
  async exec(): Promise<void> {
    try {
      // Lock all keys
      for (const key of this.lockedKeys) {
        this.client.lockKey(key);
      }

      // Queue all operations
      for (const operation of this.operations) {
        this.client.queueOperation(operation);
      }

      // Execute all operations
      await this.client.executeQueue();
      console.log(`Completed transaction with ${this.operations.length} operations`);
    } finally {
      // Unlock all keys
      for (const key of this.lockedKeys) {
        this.client.unlockKey(key);
      }
    }
  }
}

// Create a singleton instance
export const kv = new RedisClient();

export default kv;
