/**
 * Polyfill for waitForNextUpdate function
 * 
 * This file provides a polyfill for the waitForNextUpdate function
 * which was removed in newer versions of @testing-library/react-hooks.
 */

// Import React to ensure it's available
const React = require('react');
const { act } = require('@testing-library/react');

// Global state tracking
let stateUpdateCallbacks = [];
let pendingStateUpdates = 0;

/**
 * Notifies waiting tests that a state update has occurred
 */
function notifyStateUpdate() {
  pendingStateUpdates++;
  // Call all registered callbacks and clear the list
  const callbacks = [...stateUpdateCallbacks];
  stateUpdateCallbacks = [];
  callbacks.forEach(cb => cb());
}

// Patch React.useState to track state updates
const originalUseState = React.useState;
React.useState = function patchedUseState(initialState) {
  const [state, setState] = originalUseState(initialState);
  
  // Create a wrapped setState that notifies of updates
  const wrappedSetState = (newState) => {
    // Call the original setState
    setState(newState);
    // Notify of state update
    notifyStateUpdate();
  };
  
  return [state, wrappedSetState];
};

/**
 * Waits for a condition to be true
 * 
 * @param {Function} condition - Function that returns a boolean
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @param {number} interval - Interval between checks in milliseconds
 * @returns {Promise<void>}
 */
const waitForCondition = async (
  condition,
  timeout = 5000,
  interval = 50
) => {
  const start = Date.now();
  while (!condition() && Date.now() - start < timeout) {
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  if (!condition()) {
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  }
};

/**
 * Creates a Promise that resolves when the next state update occurs
 * This simulates the waitForNextUpdate functionality that was removed from @testing-library/react-hooks
 * 
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<void>}
 */
const waitForNextUpdate = async (timeout = 5000) => {
  // If there are already pending updates, consume one and resolve immediately
  if (pendingStateUpdates > 0) {
    pendingStateUpdates--;
    return Promise.resolve();
  }
  
  // Create a promise that will resolve when the next state update happens
  return new Promise((resolve, reject) => {
    // Add resolver to the queue
    stateUpdateCallbacks.push(resolve);
    
    // Set timeout to reject if no update happens within timeout
    setTimeout(() => {
      // Remove this resolver from the queue
      stateUpdateCallbacks = stateUpdateCallbacks.filter(r => r !== resolve);
      
      // Reject if no updates happened within timeout
      reject(new Error(`Timed out waiting for update after ${timeout}ms`));
    }, timeout);
  });
};

// Immediately perform a flush after any act calls
const originalAct = act;
const patchedAct = async (callback) => {
  let result;
  await originalAct(async () => {
    result = await callback();
    // Allow state updates to propagate
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  return result;
};

module.exports = {
  waitForCondition,
  waitForNextUpdate,
  act: patchedAct,
  notifyStateUpdate
};
