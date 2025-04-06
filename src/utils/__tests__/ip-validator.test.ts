import { isValidIPv4, isValidIPv6, isValidIP } from '../ip-validator';

describe('IP Address Validation', () => {
  describe('isValidIPv4', () => {
    it('should return true for valid IPv4 addresses', () => {
      const validIPv4Addresses = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '255.255.255.255',
        '0.0.0.0',
        '127.0.0.1'
      ];

      validIPv4Addresses.forEach(ip => {
        expect(isValidIPv4(ip)).toBe(true);
      });
    });

    it('should return false for invalid IPv4 addresses', () => {
      const invalidIPv4Addresses = [
        '192.168.1',         // Missing octet
        '192.168.1.256',     // Octet > 255
        '192.168.1.01',      // Leading zero
        '192.168.01.1',      // Leading zero
        '192.168.1.1.1',     // Too many octets
        '192.168.1.',        // Trailing dot
        '.192.168.1.1',      // Leading dot
        '192..168.1.1',      // Empty octet
        '192.168.1.a',       // Non-numeric
        'a.b.c.d',           // Non-numeric
        '',                  // Empty string
        ' ',                 // Whitespace
        '192.168.1.1 ',      // Trailing whitespace
        ' 192.168.1.1',      // Leading whitespace
        '192. 168.1.1',      // Whitespace in address
        '192.168.1.1/24',    // CIDR notation
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334' // IPv6
      ];

      invalidIPv4Addresses.forEach(ip => {
        expect(isValidIPv4(ip)).toBe(false);
      });
    });
  });

  describe('isValidIPv6', () => {
    it('should return true for valid IPv6 addresses', () => {
      const validIPv6Addresses = [
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        '2001:db8:85a3:0:0:8a2e:370:7334',
        '2001:db8:85a3::8a2e:370:7334',
        '::1',
        '::',
        'fe80::1',
        'fe80::217:f2ff:fe07:ed62',
        'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
        '0:0:0:0:0:0:0:0',
        '0:0:0:0:0:0:0:1'
      ];

      validIPv6Addresses.forEach(ip => {
        expect(isValidIPv6(ip)).toBe(true);
      });
    });

    it('should return false for invalid IPv6 addresses', () => {
      const invalidIPv6Addresses = [
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334:',   // Trailing colon
        ':2001:0db8:85a3:0000:0000:8a2e:0370:7334',   // Leading colon
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334:1',  // Too many segments
        '2001:0db8:85a3:0000:0000:8a2e:0370',         // Too few segments
        '2001:0db8:85a3:0000:0000:8a2e:0370:zzzz',    // Invalid hex
        '2001::85a3::8a2e:370:7334',                  // Multiple ::
        ':::1',                                        // Invalid ::
        '2001:0db8:85a3:0000:0000:8a2e:192.168.1.1',  // Mixed with invalid IPv4
        '',                                            // Empty string
        ' ',                                           // Whitespace
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334 ',   // Trailing whitespace
        ' 2001:0db8:85a3:0000:0000:8a2e:0370:7334',   // Leading whitespace
        '2001: 0db8:85a3:0000:0000:8a2e:0370:7334',   // Whitespace in address
        '192.168.1.1'                                  // IPv4
      ];

      invalidIPv6Addresses.forEach(ip => {
        expect(isValidIPv6(ip)).toBe(false);
      });
    });

    it('should handle IPv4-mapped IPv6 addresses correctly', () => {
      const ipv4MappedIPv6Addresses = [
        '::ffff:192.168.1.1',
        '::ffff:c0a8:0101',
        '0:0:0:0:0:ffff:192.168.1.1'
      ];

      ipv4MappedIPv6Addresses.forEach(ip => {
        expect(isValidIPv6(ip)).toBe(true);
      });
    });
  });

  describe('isValidIP', () => {
    it('should return true for valid IP addresses (both IPv4 and IPv6)', () => {
      const validIPAddresses = [
        '192.168.1.1',           // IPv4
        '2001:db8:85a3::8a2e:370:7334', // IPv6
        '::1',                   // IPv6 localhost
        '127.0.0.1'              // IPv4 localhost
      ];

      validIPAddresses.forEach(ip => {
        expect(isValidIP(ip)).toBe(true);
      });
    });

    it('should return false for invalid IP addresses', () => {
      const invalidIPAddresses = [
        '192.168.1',             // Invalid IPv4
        '2001:db8:85a3::8a2e:370:zzzz', // Invalid IPv6
        '',                      // Empty string
        ' ',                     // Whitespace
        'not-an-ip',             // Not an IP
        '192.168.1.1/24',        // CIDR notation
        '192.168.1.1 ',          // Trailing whitespace
        ' 192.168.1.1',          // Leading whitespace
        '192. 168.1.1'           // Whitespace in address
      ];

      invalidIPAddresses.forEach(ip => {
        expect(isValidIP(ip)).toBe(false);
      });
    });
  });
});
