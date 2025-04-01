/**
 * Hash operations for the in-memory Redis implementation
 * 
 * This file adds hash operations (hset, hget, hdel, hkeys) to the MemoryRedis class
 */
import { MemoryRedis } from './memory-store';

// Add hash operations to the MemoryRedis prototype
MemoryRedis.prototype.hset = async function(
  key: string, 
  field: string, 
  value: string
): Promise<number> {
  // Create a Map for the hash if it doesn't exist
  if (!this.store.has(key)) {
    this.store.set(key, new Map<string, string>());
  }
  
  const hash = this.store.get(key);
  const isNew = !hash.has(field);
  
  // Set the field-value pair
  hash.set(field, value);
  
  // Return 1 if field is new, 0 if field was updated
  return isNew ? 1 : 0;
};

MemoryRedis.prototype.hget = async function(
  key: string, 
  field: string
): Promise<string | null> {
  // Return null if hash doesn't exist
  if (!this.store.has(key)) {
    return null;
  }
  
  const hash = this.store.get(key);
  const value = hash.get(field);
  
  // Return null if field doesn't exist
  return value !== undefined ? value : null;
};

MemoryRedis.prototype.hdel = async function(
  key: string, 
  ...fields: string[]
): Promise<number> {
  // Return 0 if hash doesn't exist
  if (!this.store.has(key)) {
    return 0;
  }
  
  const hash = this.store.get(key);
  let deleted = 0;
  
  // Delete each field and count successful deletions
  for (const field of fields) {
    if (hash.delete(field)) {
      deleted++;
    }
  }
  
  // If hash is now empty, remove it
  if (hash.size === 0) {
    this.store.delete(key);
  }
  
  return deleted;
};

MemoryRedis.prototype.hkeys = async function(
  key: string
): Promise<string[]> {
  // Return empty array if hash doesn't exist
  if (!this.store.has(key)) {
    return [];
  }
  
  const hash = this.store.get(key);
  
  // Return all field names
  return Array.from(hash.keys());
};

// Add hgetall operation for completeness
MemoryRedis.prototype.hgetall = async function(
  key: string
): Promise<Record<string, string> | null> {
  // Return null if hash doesn't exist
  if (!this.store.has(key)) {
    return null;
  }
  
  const hash = this.store.get(key);
  const result: Record<string, string> = {};
  
  // Convert Map to plain object
  for (const [field, value] of hash.entries()) {
    result[field] = value;
  }
  
  return result;
};

// Add hmset operation for completeness
MemoryRedis.prototype.hmset = async function(
  key: string,
  ...fieldValues: string[]
): Promise<'OK'> {
  // Create a Map for the hash if it doesn't exist
  if (!this.store.has(key)) {
    this.store.set(key, new Map<string, string>());
  }
  
  const hash = this.store.get(key);
  
  // Process field-value pairs
  for (let i = 0; i < fieldValues.length; i += 2) {
    const field = fieldValues[i];
    const value = fieldValues[i + 1];
    
    if (field && value !== undefined) {
      hash.set(field, value);
    }
  }
  
  return 'OK';
};

// Add hincrby operation for completeness
MemoryRedis.prototype.hincrby = async function(
  key: string,
  field: string,
  increment: number
): Promise<number> {
  // Create a Map for the hash if it doesn't exist
  if (!this.store.has(key)) {
    this.store.set(key, new Map<string, string>());
  }
  
  const hash = this.store.get(key);
  
  // Get current value or default to 0
  const currentValue = hash.has(field) ? parseInt(hash.get(field), 10) : 0;
  
  // Calculate new value
  const newValue = currentValue + increment;
  
  // Store new value
  hash.set(field, newValue.toString());
  
  return newValue;
};

// Extend the MemoryRedis type definition to include the new methods
declare module './memory-store' {
  interface MemoryRedis {
    hset(key: string, field: string, value: string): Promise<number>;
    hget(key: string, field: string): Promise<string | null>;
    hdel(key: string, ...fields: string[]): Promise<number>;
    hkeys(key: string): Promise<string[]>;
    hgetall(key: string): Promise<Record<string, string> | null>;
    hmset(key: string, ...fieldValues: string[]): Promise<'OK'>;
    hincrby(key: string, field: string, increment: number): Promise<number>;
  }
}
