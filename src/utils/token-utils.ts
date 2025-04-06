/**
 * Decodes a JWT token and returns the payload
 * 
 * @param token - The JWT token to decode
 * @returns The decoded payload or null if the token is invalid
 */
export const decodeToken = (token: string): any => {
  try {
    if (!token) {
      return null;
    }
    
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Get the payload (second part)
    const base64Url = parts[1];
    
    // Replace characters for base64 decoding
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode the base64 string
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    // Parse the JSON payload
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};
