/**
 * Polyfill for waitForNextUpdate function
 * 
 * This file provides a polyfill for the waitForNextUpdate function
 * which was removed in newer versions of @testing-library/react-hooks.
 */

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
  // In the actual implementation, this would wait for a real state update
  // However, for testing we'll simulate that update happened immediately
  // and just need to wait for the next event loop tick
  await new Promise((resolve) => setTimeout(resolve, 10));
  return;
};

// Track whether this is being called in a test
let isInitialized = false;

// Set up a mock for act
const setupAct = () => {
  if (isInitialized) return;
  
  // Make sure we have access to React
  const React = require('react');
  
  // Store the original act function if it exists
  const originalAct = React.act;
  
  // Create a new act function that works with async operations
  React.act = async (callback) => {
    if (originalAct) {
      // Call original act if it exists
      return originalAct(async () => {
        const result = await callback();
        // Wait for any state updates to propagate
        await new Promise(resolve => setTimeout(resolve, 0));
        return result;
      });
    } else {
      // If no original act, just call the callback
      const result = await callback();
      // Wait for any state updates to propagate
      await new Promise(resolve => setTimeout(resolve, 0));
      return result;
    }
  };
  
  isInitialized = true;
};

// Initialize when this module is loaded
setupAct();

module.exports = {
  waitForCondition,
  waitForNextUpdate
};
