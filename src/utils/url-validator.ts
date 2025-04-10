/**
 * Validates if a URL is safe for redirection
 *
 * @param url The URL to validate
 * @returns True if the URL is safe for redirection, false otherwise
 */
export function isValidReturnUrl(url: string): boolean {
  if (!url) {
    return false;
  }

  // Only allow relative URLs (starting with /)
  if (!url.startsWith('/')) {
    return false;
  }

  // Disallow URLs with protocol-relative notation
  if (url.startsWith('//')) {
    return false;
  }

  // Disallow URLs with encoded protocols
  const decodedUrl = decodeURIComponent(url);
  if (
    decodedUrl.includes('javascript:') ||
    decodedUrl.includes('data:') ||
    decodedUrl.match(/https?:\/\//i)
  ) {
    return false;
  }

  // Only allow URLs from a whitelist of safe paths
  const allowedPaths = [
    '/admin',
    '/dashboard',
    '/profile',
    '/listings',
    '/search'
  ];

  // Check if the URL starts with any of the allowed paths
  return allowedPaths.some(path => {
    // Exact match
    if (url === path) {
      return true;
    }

    // Path with additional segments or query parameters
    if (url.startsWith(path + '/') || url.startsWith(path + '?')) {
      return true;
    }

    return false;
  });
}
