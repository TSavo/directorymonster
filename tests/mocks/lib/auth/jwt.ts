// Standard JWT mock implementation
import { JwtPayload } from 'jsonwebtoken';

// Mock JWT tokens and payloads
export interface MockJwtPayload extends JwtPayload {
  userId: string;
}

// Default user ID
export const DEFAULT_USER_ID = 'user-123';

// Standard token responses
export const VALID_TOKEN = 'valid-token';
export const INVALID_TOKEN = 'invalid-token';
export const EXPIRED_TOKEN = 'expired-token';

// Predefined payloads
export const VALID_PAYLOAD: MockJwtPayload = {
  userId: DEFAULT_USER_ID
};

// Mock JWT functions
export const decode = jest.fn().mockImplementation((token: string): MockJwtPayload | null => {
  if (token === VALID_TOKEN) {
    return VALID_PAYLOAD;
  }
  return null;
});

export const verify = jest.fn().mockImplementation((token: string, secret: string): MockJwtPayload => {
  if (token === VALID_TOKEN) {
    return VALID_PAYLOAD;
  }
  
  if (token === EXPIRED_TOKEN) {
    throw new Error('jwt expired');
  }
  
  throw new Error('Invalid token');
});

export const sign = jest.fn().mockImplementation((payload: any): string => {
  return VALID_TOKEN;
});

// Setup function to configure the JWT mock
export function setupJwtMock() {
  jest.mock('jsonwebtoken', () => ({
    decode,
    verify,
    sign,
    JwtPayload: {}
  }));
}

// Reset function for tests
export function resetJwtMock() {
  decode.mockClear();
  verify.mockClear();
  sign.mockClear();
}
