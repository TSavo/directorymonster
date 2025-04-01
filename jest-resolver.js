// This resolver helps Jest find modules with custom paths or aliases
const path = require('path');

module.exports = (request, options) => {
  // Handle @/ path alias
  if (request.startsWith('@/')) {
    return path.resolve(__dirname, 'src', request.substr(2));
  }

  // Handle relative paths for test files
  const relativeSrcPath = '../../../../../../src/';
  if (request.includes(relativeSrcPath)) {
    const newPath = request.replace(relativeSrcPath, 'src/');
    return path.resolve(__dirname, newPath);
  }

  // Let Jest handle the request normally
  return options.defaultResolver(request, options);
};
