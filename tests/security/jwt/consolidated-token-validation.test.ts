/**
 * Consolidated JWT Token Validation Tests
 *
 * Tests for verifying the consolidated token validation module.
 */

import { 
  generateToken, 
  verifyTokenSync, 
  verifyToken,
  verifyAuthHeaderSync,
  verifyAuthHeader,
  EnhancedJwtPayload,
  getTokenConfig
} from '@/lib/auth/token-validation';
import { getRedisClient } from '@/lib/redis-client';

// Mock Redis client
jest.mock('@/lib/redis-client', () => {
  const mockRedisClient = {
    get: jest.fn().mockResolvedValue(null), // Default: token not revoked
    setex: jest.fn(),
    exists: jest.fn()
  };
  
  return {
    getRedisClient: jest.fn(() => mockRedisClient)
  };
});

describe('Consolidated JWT Token Validation', () => {
  let mockRedisClient: any;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockRedisClient = getRedisClient();
    
    // Set environment variables for testing
    process.env.JWT_SECRET = 'test-secret-for-validation';
    process.env.JWT_ALGORITHM = 'HS256';
    process.env.JWT_EXPIRES_IN = '3600';
  });
  
  afterEach(() => {
    // Reset environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_ALGORITHM;
    delete process.env.JWT_EXPIRES_IN;
  });
  
  describe('getTokenConfig function', () => {
    it('should return configuration from environment variables', () => {
      // Act
      const config = getTokenConfig();
      
      // Assert
      expect(config.secret).toBe('test-secret-for-validation');
      expect(config.algorithm).toBe('HS256');
      expect(config.expiresIn).toBe(3600);
    });
    
    it('should use default values when environment variables are not set', () => {
      // Arrange
      delete process.env.JWT_SECRET;
      delete process.env.JWT_ALGORITHM;
      delete process.env.JWT_EXPIRES_IN;
      
      // Act
      const config = getTokenConfig();
      
      // Assert
      expect(config.secret).toBe('default-secret-for-development');
      expect(config.algorithm).toBe('HS256');
      expect(config.expiresIn).toBe(3600);
    });
  });
  
  describe('generateToken function', () => {
    it('should generate a valid token with required claims', () => {
      // Arrange
      const payload = { userId: 'test-user-123' };
      
      // Act
      const token = generateToken(payload);
      
      // Assert
      expect(token).toBeTruthy();
      
      // Decode the token to verify claims
      const decoded = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      ) as EnhancedJwtPayload;
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.jti).toBeTruthy(); // Should have a JTI claim
      expect(decoded.iat).toBeTruthy(); // Should have an IAT claim
      expect(decoded.exp).toBeTruthy(); // Should have an EXP claim
    });
    
    it('should allow additional claims in the payload', () => {
      // Arrange
      const payload = { 
        userId: 'test-user-456',
        role: 'admin',
        tenantId: 'tenant-789'
      };
      
      // Act
      const token = generateToken(payload as any);
      
      // Assert
      const decoded = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      ) as EnhancedJwtPayload & { role: string, tenantId: string };
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.tenantId).toBe(payload.tenantId);
    });
  });
  
  describe('verifyTokenSync function', () => {
    it('should accept valid tokens', () => {
      // Arrange
      const payload = { userId: 'test-user-123' };
      const token = generateToken(payload);
      
      // Act
      const result = verifyTokenSync(token);
      
      // Assert
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(payload.userId);
    });
    
    it('should reject tokens without userId claim', () => {
      // Arrange - Create a token without userId
      const token = generateToken({ userId: '' } as any);
      
      // Act
      const result = verifyTokenSync(token);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should reject tokens with invalid signature', () => {
      // Arrange
      const payload = { userId: 'test-user-123' };
      const token = generateToken(payload);
      
      // Tamper with the token
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.invalid-signature`;
      
      // Act
      const result = verifyTokenSync(tamperedToken);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('verifyToken function', () => {
    it('should accept valid tokens that are not revoked', async () => {
      // Arrange
      const payload = { userId: 'test-user-123' };
      const token = generateToken(payload);
      mockRedisClient.get.mockResolvedValue(null); // Not revoked
      
      // Act
      const result = await verifyToken(token);
      
      // Assert
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(payload.userId);
    });
    
    it('should reject revoked tokens', async () => {
      // Arrange
      const payload = { userId: 'test-user-123' };
      const token = generateToken(payload);
      mockRedisClient.get.mockResolvedValue('1'); // Revoked
      
      // Act
      const result = await verifyToken(token);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('verifyAuthHeaderSync function', () => {
    it('should accept valid authorization headers', () => {
      // Arrange
      const payload = { userId: 'test-user-123' };
      const token = generateToken(payload);
      const authHeader = `Bearer ${token}`;
      
      // Act
      const result = verifyAuthHeaderSync(authHeader);
      
      // Assert
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(payload.userId);
    });
    
    it('should reject headers without Bearer prefix', () => {
      // Arrange
      const payload = { userId: 'test-user-123' };
      const token = generateToken(payload);
      const authHeader = token; // Missing Bearer prefix
      
      // Act
      const result = verifyAuthHeaderSync(authHeader);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should reject null or empty headers', () => {
      // Act & Assert
      expect(verifyAuthHeaderSync(null)).toBeNull();
      expect(verifyAuthHeaderSync('')).toBeNull();
    });
  });
  
  describe('verifyAuthHeader function', () => {
    it('should accept valid authorization headers for non-revoked tokens', async () => {
      // Arrange
      const payload = { userId: 'test-user-123' };
      const token = generateToken(payload);
      const authHeader = `Bearer ${token}`;
      mockRedisClient.get.mockResolvedValue(null); // Not revoked
      
      // Act
      const result = await verifyAuthHeader(authHeader);
      
      // Assert
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(payload.userId);
    });
    
    it('should reject authorization headers for revoked tokens', async () => {
      // Arrange
      const payload = { userId: 'test-user-123' };
      const token = generateToken(payload);
      const authHeader = `Bearer ${token}`;
      mockRedisClient.get.mockResolvedValue('1'); // Revoked
      
      // Act
      const result = await verifyAuthHeader(authHeader);
      
      // Assert
      expect(result).toBeNull();
    });
  });
});
