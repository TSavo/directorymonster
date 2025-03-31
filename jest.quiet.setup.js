// Suppress console output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

// You can customize what gets filtered by modifying these functions
console.log = function() {
  // Uncomment to allow some log messages to pass through
  // if (arguments[0] && arguments[0].includes('IMPORTANT:')) {
  //   originalConsoleLog.apply(console, arguments);
  // }
};

console.error = function() {
  // Allow critical errors through
  if (arguments[0] && 
      (arguments[0].startsWith('Error:') || 
       arguments[0].startsWith('FATAL:') ||
       (typeof arguments[0] === 'object' && arguments[0] instanceof Error))) {
    originalConsoleError.apply(console, arguments);
  }
};

console.warn = function() {
  // Allow critical warnings through
  if (arguments[0] && arguments[0].startsWith('Critical Warning:')) {
    originalConsoleWarn.apply(console, arguments);
  }
};

console.info = function() { 
  // Suppress all info logs
};

// Restore the original console methods after tests
afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
});