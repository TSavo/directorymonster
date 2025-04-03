/**
 * Utility functions for generating unique IDs
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID
 * 
 * @returns A unique ID string
 */
export function generateId(): string {
  return uuidv4();
}
