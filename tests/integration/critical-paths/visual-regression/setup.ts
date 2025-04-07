/**
 * Visual Regression Test Setup
 *
 * This file provides utilities for visual regression testing.
 */

import { render } from '@testing-library/react';

// Custom render function for visual regression tests
export const renderForSnapshot = (ui: React.ReactElement) => {
  const { container } = render(ui);
  return container;
};

// Function to create a snapshot of a component
export const createComponentSnapshot = (container: HTMLElement) => {
  // In a real implementation, this would use a library like puppeteer
  // to take a screenshot of the component
  return container.innerHTML;
};

// Function to compare snapshots
export const compareSnapshots = (snapshot: string, snapshotName: string) => {
  expect(snapshot).toMatchSnapshot(snapshotName);
};

// Function to create and compare a snapshot in one step
export const snapshotTest = (container: HTMLElement, snapshotName: string) => {
  const snapshot = createComponentSnapshot(container);
  compareSnapshots(snapshot, snapshotName);
};
