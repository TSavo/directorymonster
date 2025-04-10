import { isValidReturnUrl } from '../url-validator';

describe('isValidReturnUrl', () => {
  it('should return false for empty URLs', () => {
    expect(isValidReturnUrl('')).toBe(false);
    expect(isValidReturnUrl(null as unknown as string)).toBe(false);
    expect(isValidReturnUrl(undefined as unknown as string)).toBe(false);
  });

  it('should return false for absolute URLs', () => {
    expect(isValidReturnUrl('http://example.com')).toBe(false);
    expect(isValidReturnUrl('https://example.com')).toBe(false);
    expect(isValidReturnUrl('https://evil.com/redirect?to=/admin')).toBe(false);
  });

  it('should return false for protocol-relative URLs', () => {
    expect(isValidReturnUrl('//example.com')).toBe(false);
  });

  it('should return false for URLs with javascript protocol', () => {
    expect(isValidReturnUrl('/javascript:alert(1)')).toBe(false);
    expect(isValidReturnUrl('/javascript:void(0)')).toBe(false);
    expect(isValidReturnUrl('/%6A%61%76%61%73%63%72%69%70%74:alert(1)')).toBe(false); // URL encoded
  });

  it('should return false for URLs with data protocol', () => {
    expect(isValidReturnUrl('/data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidReturnUrl('/%64%61%74%61:text/html,<script>alert(1)</script>')).toBe(false); // URL encoded
  });

  it('should return true for valid relative URLs in the whitelist', () => {
    expect(isValidReturnUrl('/admin')).toBe(true);
    expect(isValidReturnUrl('/dashboard')).toBe(true);
    expect(isValidReturnUrl('/profile?tab=settings')).toBe(true);
    expect(isValidReturnUrl('/listings/123')).toBe(true);
    expect(isValidReturnUrl('/search?q=test&category=all')).toBe(true);
  });

  it('should return false for paths not in the whitelist', () => {
    expect(isValidReturnUrl('/random-path')).toBe(false);
    expect(isValidReturnUrl('/unknown')).toBe(false);
    expect(isValidReturnUrl('/admin-hack')).toBe(false);
    expect(isValidReturnUrl('/profiles')).toBe(false); // Note: '/profile' is allowed but '/profiles' is not
  });
});
