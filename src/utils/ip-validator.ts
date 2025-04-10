/**
 * Validates an IPv4 address
 *
 * @param ip - The IP address to validate
 * @returns True if the IP address is a valid IPv4 address, false otherwise
 */
export const isValidIPv4 = (ip: string): boolean => {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  // Check for whitespace within the IP address
  if (ip.trim() !== ip) {
    return false;
  }

  // Regular expression for IPv4 validation
  // - Must have exactly 4 octets separated by dots
  // - Each octet must be a number between 0 and 255
  // - No leading zeros allowed (e.g., 01.02.03.04 is invalid)
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/;

  // Check for CIDR notation
  if (ip.includes('/')) {
    return false;
  }

  // Check for leading zeros in octets
  const octets = ip.split('.');
  if (octets.length !== 4) {
    return false;
  }

  for (const octet of octets) {
    // Check for empty octets
    if (octet === '') {
      return false;
    }

    // Check for leading zeros (except for '0' itself)
    if (octet.length > 1 && octet.startsWith('0')) {
      return false;
    }

    // Check for non-numeric characters
    if (!/^\d+$/.test(octet)) {
      return false;
    }

    // Check for values outside the valid range
    const value = parseInt(octet, 10);
    if (value < 0 || value > 255) {
      return false;
    }
  }

  return ipv4Regex.test(ip);
};

/**
 * Validates an IPv6 address
 *
 * @param ip - The IP address to validate
 * @returns True if the IP address is a valid IPv6 address, false otherwise
 */
export const isValidIPv6 = (ip: string): boolean => {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  // Check for whitespace within the IP address
  if (ip.trim() !== ip) {
    return false;
  }

  // Check for IPv4 addresses
  if (isValidIPv4(ip)) {
    return false;
  }

  // Special cases
  if (ip === '::') return true;
  if (ip === '::1') return true;

  // Check for IPv4-mapped IPv6 addresses
  if (ip.includes('.')) {
    // Handle IPv4-mapped IPv6 addresses (e.g., ::ffff:192.168.1.1)
    const parts = ip.split(':');
    const ipv4Part = parts[parts.length - 1];

    if (ipv4Part && ipv4Part.includes('.')) {
      // Verify the IPv4 part is valid
      if (!isValidIPv4(ipv4Part)) {
        return false;
      }

      // Check if the IPv6 part is valid
      const prefix = ip.substring(0, ip.lastIndexOf(':') + 1);
      if (!prefix.startsWith('::ffff:') && !prefix.startsWith('0:0:0:0:0:ffff:')) {
        return false;
      }

      // Count the number of colons to ensure we don't have too many segments
      const colonCount = (ip.match(/:/g) || []).length;
      if (colonCount > 7) {
        return false;
      }

      return true;
    }
    return false;
  }

  // Basic validation for standard IPv6
  // Check for triple colons (:::)
  if (ip.includes(':::')) {
    return false;
  }

  // Check for multiple '::' (only one allowed)
  const doubleColonCount = (ip.match(/::/g) || []).length;
  if (doubleColonCount > 1) {
    return false;
  }

  // Count the number of segments
  const segments = ip.split(':');

  // Handle the case of :: at the beginning or end
  if (ip.startsWith(':') && !ip.startsWith('::')) {
    return false;
  }
  if (ip.endsWith(':') && !ip.endsWith('::')) {
    return false;
  }

  // Check for too many segments
  // IPv6 should have at most 8 segments
  // If we have ::, we can have fewer segments
  if (segments.length > 8) {
    return false;
  }

  // If we don't have ::, we must have exactly 8 segments
  if (doubleColonCount === 0 && segments.length !== 8) {
    return false;
  }

  // Check each segment for valid hex
  for (const segment of segments) {
    if (segment === '') continue; // Skip empty segments (part of ::)

    // Check for valid hex and length
    if (!/^[0-9a-fA-F]{1,4}$/.test(segment)) {
      return false;
    }
  }

  return true;
};

/**
 * Validates an IP address (either IPv4 or IPv6)
 *
 * @param ip - The IP address to validate
 * @returns True if the IP address is valid (either IPv4 or IPv6), false otherwise
 */
export const isValidIP = (ip: string): boolean => {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  // Check for whitespace, CIDR notation, or other invalid characters
  if (ip.trim() !== ip || ip.includes('/') || ip.includes(' ')) {
    return false;
  }

  return isValidIPv4(ip) || isValidIPv6(ip);
};
