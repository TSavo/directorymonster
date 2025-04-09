/**
 * Mock for @testing-library/react-hooks
 *
 * This mock provides compatibility for tests that use the waitForNextUpdate function
 * which was removed in newer versions of the library.
 */

const { waitForNextUpdate: waitForUpdate, waitForCondition } = require('../../utils/testing-library-hooks-fix');
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

// Track state updates to implement waitForNextUpdate
let pendingStateUpdates = 0;
let stateUpdateResolvers = [];

// Function to notify waiters when state updates
function notifyStateUpdate() {
  pendingStateUpdates++;
  stateUpdateResolvers.forEach(resolve => resolve());
  stateUpdateResolvers = [];
}

// Mock React.useState
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
    // Notify waiters about state update
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

// Proper implementation of waitForNextUpdate
const waitForNextUpdate = async (timeout = 5000) => {
  // Check if there are already pending updates
  if (pendingStateUpdates > 0) {
    pendingStateUpdates--;
    return;
  }

  // Wait for the next update
  return new Promise((resolve, reject) => {
    // Add resolver to the queue
    stateUpdateResolvers.push(resolve);

    // Set timeout
    setTimeout(() => {
      // Remove this resolver from the queue
      stateUpdateResolvers = stateUpdateResolvers.filter(r => r !== resolve);
      
      // Reject if no updates happened within timeout
      reject(new Error(`Timed out waiting for update after ${timeout}ms`));
    }, timeout);
  });
};

// Export the mock module
module.exports = {
  renderHook: jest.fn((callback, options = {}) => {
    // Reset hook state for each test
    resetHookState();

    // Initial render
    let current = callback(options.initialProps || {});

    // Create a mock result object
    const result = {
      current: current,
      waitForNextUpdate: async (timeout = 5000) => {
        // Use our implementation of waitForNextUpdate
        await waitForNextUpdate(timeout);
        
        // Reset hook index for next render
        hookIndex = 0;
        
        // Update current value
        current = callback(options.initialProps || {});
        result.current = current;
        
        return;
      },
      rerender: jest.fn((newProps) => {
        // Reset hook index for rerender
        hookIndex = 0;

        // Call the callback with new props
        current = callback(newProps || options.initialProps || {});
        result.current = current;
        return current;
      }),
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

    return {
      result,
      waitForNextUpdate: result.waitForNextUpdate,
      rerender: result.rerender,
      unmount: result.unmount
    };
  }),
  act: jest.fn(async (callback) => {
    // Execute the callback
    await callback();

    // Reset hook index for next render
    hookIndex = 0;
  }),
  waitForNextUpdate
};
