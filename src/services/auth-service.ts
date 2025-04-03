import jwt from 'jsonwebtoken';

/**
 * Interface for token validation result
 */
interface TokenValidationResult {
  userId?: string;
  tenantId?: string;
  permissions?: string[];
  isValid: boolean;
  error?: string;
}

/**
 * Service for handling authentication and authorization
 */
export class AuthService {
  /**
   * Validate a JWT token
   *
   * @param token The JWT token to validate
   * @returns The validation result
   */
  static async validateToken(token: string | null | undefined): Promise<TokenValidationResult> {
    try {
      // Check if token is provided
      if (!token) {
        return {
          isValid: false,
          error: 'No token provided'
        };
      }

      // Get JWT configuration from environment variables
      const secret = process.env.JWT_SECRET;
      const issuer = process.env.JWT_ISSUER;
      const audience = process.env.JWT_AUDIENCE;

      if (!secret) {
        console.error('JWT_SECRET environment variable is not set');
        return {
          isValid: false,
          error: 'JWT configuration error'
        };
      }

      // Verify the token
      try {
        const decoded = jwt.verify(token, secret, {
          issuer,
          audience
        }) as jwt.JwtPayload;

        // Extract user ID, tenant ID, and permissions from token
        const userId = decoded.sub;
        const tenantId = decoded.tenantId as string;
        const permissions = decoded.permissions as string[];

        if (!userId || !tenantId) {
          return {
            isValid: false,
            error: 'Invalid token payload'
          };
        }

        return {
          userId,
          tenantId,
          permissions: permissions || [],
          isValid: true
        };
      } catch (verifyError: any) {
        // Handle specific JWT errors
        if (verifyError.name === 'TokenExpiredError') {
          return {
            isValid: false,
            error: 'Token expired'
          };
        } else if (verifyError.name === 'JsonWebTokenError') {
          return {
            isValid: false,
            error: 'Invalid token'
          };
        } else if (verifyError.name === 'NotBeforeError') {
          return {
            isValid: false,
            error: 'Token not yet valid'
          };
        } else if (verifyError.message.includes('jwt issuer invalid')) {
          return {
            isValid: false,
            error: 'Invalid token issuer'
          };
        } else if (verifyError.message.includes('jwt audience invalid')) {
          return {
            isValid: false,
            error: 'Invalid token audience'
          };
        }

        // Generic error
        throw verifyError;
      }
    } catch (error) {
      // Generic error
      console.error('Error validating token:', error);
      return {
        isValid: false,
        error: 'Token validation error'
      };
    }
  }

  /**
   * Check if a token has a specific permission
   *
   * @param token The JWT token to check
   * @param permission The permission to check for
   * @returns True if the token has the permission, false otherwise
   */
  static async hasPermission(token: string | null | undefined, permission: string): Promise<boolean> {
    try {
      // Validate the token
      const validationResult = await this.validateToken(token);

      // Check if token is valid
      if (!validationResult.isValid) {
        return false;
      }

      // Check if token has the required permission
      return validationResult.permissions?.includes(permission) || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Extract user ID and tenant ID from a token
   *
   * @param token The JWT token
   * @returns The user ID and tenant ID, or null if token is invalid
   */
  static async extractUserInfo(token: string | null | undefined): Promise<{ userId: string; tenantId: string } | null> {
    try {
      // Validate the token
      const validationResult = await this.validateToken(token);

      // Check if token is valid
      if (!validationResult.isValid || !validationResult.userId || !validationResult.tenantId) {
        return null;
      }

      return {
        userId: validationResult.userId,
        tenantId: validationResult.tenantId
      };
    } catch (error) {
      console.error('Error extracting user info:', error);
      return null;
    }
  }
}
