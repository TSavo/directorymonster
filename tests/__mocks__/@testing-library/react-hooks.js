/**
 * Mock for @testing-library/react-hooks
 *
 * This mock provides compatibility for tests that use the waitForNextUpdate function
 * which was removed in newer versions of the library.
 */

const { waitForNextUpdate: waitForUpdate, act, notifyStateUpdate } = require('../../utils/testing-library-hooks-fix');
const React = require('react');

// Store for hook state
let hookStates = [];
let hookIndex = 0;
let effectCleanups = [];
let effectDependencies = [];

// Reset function to clear state between tests
function resetHookState() {
  hookStates = [];
  hookIndex = 0;
  effectCleanups = [];
  effectDependencies = [];
}

// Mock React.useState
const originalUseState = React.useState;
React.useState = jest.fn((initialValue) => {
  const index = hookIndex++;
  if (hookStates[index] === undefined) {
    hookStates[index] = initialValue;
  }

  const setState = jest.fn((newValue) => {
    if (typeof newValue === 'function') {
      hookStates[index] = newValue(hookStates[index]);
    } else {
      hookStates[index] = newValue;
    }
    // Notify about state updates for waitForNextUpdate
    notifyStateUpdate();
    return hookStates[index];
  });

  return [hookStates[index], setState];
});

// Mock React.useEffect
React.useEffect = jest.fn((callback, deps) => {
  const index = effectDependencies.length;
  const hasChanged = !effectDependencies[index] ||
    !deps ||
    deps.some((dep, i) => dep !== effectDependencies[index][i]);

  if (hasChanged) {
    // Clean up previous effect if it exists
    if (effectCleanups[index]) {
      effectCleanups[index]();
    }

    // Run the effect and store any cleanup function
    effectDependencies[index] = deps;
    const cleanup = callback();
    effectCleanups[index] = cleanup;
  }
});

// Mock React.useCallback
React.useCallback = jest.fn((callback, deps) => callback);

// Mock React.useMemo
React.useMemo = jest.fn((callback, deps) => callback());

// Mock React.useRef
React.useRef = jest.fn((initialValue) => {
  const index = hookIndex++;
  if (hookStates[index] === undefined) {
    hookStates[index] = { current: initialValue };
  }
  return hookStates[index];
});

// Mock React.useContext
React.useContext = jest.fn((context) => ({
  ...context._currentValue
}));

/**
 * Renders a hook and returns a result object with helpful methods
 * 
 * @param {Function} callback - The hook to render
 * @param {Object} options - Additional options
 * @returns {Object} The render result
 */
const renderHookImpl = (callback, options = {}) => {
  // Reset hook state for each test
  resetHookState();

  // Initial render
  let current = callback(options.initialProps || {});

  // Create a result object with the current value and helpful methods
  const result = {
    current,
    // Wait for next update
    waitForNextUpdate: async (timeout = 5000) => {
      await waitForUpdate(timeout);
      
      // Reset hook index and re-render
      hookIndex = 0;
      current = callback(options.initialProps || {});
      result.current = current;
      
      return;
    },
    // Re-render with new props
    rerender: jest.fn((newProps) => {
      // Reset hook index for rerender
      hookIndex = 0;

      // Call the callback with new props
      current = callback(newProps || options.initialProps || {});
      result.current = current;
      return result;
    }),
    // Unmount the hook
    unmount: jest.fn(() => {
      // Run cleanup functions
      effectCleanups.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
      resetHookState();
    })
  };

  return result;
};

// Export the mock module
module.exports = {
  renderHook: jest.fn(renderHookImpl),
  act,
  waitForNextUpdate: waitForUpdate
};
