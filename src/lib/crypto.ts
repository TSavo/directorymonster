import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

// Convert callback-based scrypt to promise-based
const scryptAsync = promisify(scrypt);

/**
 * Hash a password with a random salt
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = randomBytes(16).toString('hex');
  
  // Hash password with salt
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  
  // Return salt+hash
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(storedPassword: string, suppliedPassword: string): Promise<boolean> {
  // Split hash into salt and key
  const [salt, storedHash] = storedPassword.split(':');
  
  // Hash the supplied password with the same salt
  const derivedKey = await scryptAsync(suppliedPassword, salt, 64) as Buffer;
  
  // Compare hashes using timing-safe comparison
  return storedHash === derivedKey.toString('hex');
}

/**
 * Generate a secure token for password reset
 */
export async function generatePasswordResetToken(): Promise<string> {
  return randomBytes(32).toString('hex');
}

/**
 * Generate a secure session token
 */
export async function generateSessionToken(): Promise<string> {
  return randomBytes(48).toString('hex');
}
