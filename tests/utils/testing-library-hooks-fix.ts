/**
 * Polyfill for waitForNextUpdate function
 * 
 * This file provides a polyfill for the waitForNextUpdate function
 * which was removed in newer versions of @testing-library/react-hooks.
 */

import { act } from '@testing-library/react';

// Global state tracking
let stateUpdateCallbacks: Array<() => void> = [];
let pendingStateUpdates = 0;

/**
 * Notifies waiting tests that a state update has occurred
 */
export function notifyStateUpdate(): void {
  pendingStateUpdates++;
  // Call all registered callbacks and clear the list
  const callbacks = [...stateUpdateCallbacks];
  stateUpdateCallbacks = [];
  callbacks.forEach(cb => cb());
}

// Try to patch React.useState to track state updates
try {
  // Note: This is a hack and might not work in all environments
  const React = require('react');
  const originalUseState = React.useState;
  
  React.useState = function patchedUseState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void] {
    const [state, setState] = originalUseState(initialState);
    
    // Create a wrapped setState that notifies of updates
    const wrappedSetState = (newState: T | ((prevState: T) => T)) => {
      // Call the original setState
      setState(newState);
      // Notify of state update
      notifyStateUpdate();
    };
    
    return [state, wrappedSetState];
  };
} catch (error) {
  console.warn('Could not patch React.useState, waitForNextUpdate might not work correctly');
}

/**
 * Waits for a condition to be true
 * 
 * @param condition - Function that returns a boolean
 * @param timeout - Maximum time to wait in milliseconds
 * @param interval - Interval between checks in milliseconds
 * @returns Promise that resolves when the condition is true
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> => {
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
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise that resolves when the next state update occurs
 */
export const waitForNextUpdate = async (timeout = 5000): Promise<void> => {
  // If there are already pending updates, consume one and resolve immediately
  if (pendingStateUpdates > 0) {
    pendingStateUpdates--;
    return Promise.resolve();
  }
  
  // Create a promise that will resolve when the next state update happens
  return new Promise<void>((resolve, reject) => {
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

/**
 * Wrapper around act that ensures state updates are completed
 * 
 * @param callback - Function to execute within act
 * @returns Promise that resolves with the result of the callback
 */
export const actWithStateUpdates = async <T>(callback: () => T | Promise<T>): Promise<T> => {
  let result: T;
  await act(async () => {
    result = await callback();
    // Allow state updates to propagate
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  return result!;
};

export { act };
