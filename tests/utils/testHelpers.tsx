/**
 * Common test utilities for DirectoryMonster
 * 
 * This file contains helper functions and utilities used across multiple test files
 * to reduce duplication and maintain consistency in the testing approach.
 */
import React from 'react';
import { render, RenderResult } from '@testing-library/react';

/**
 * Renders a component within a table context
 * 
 * Many table-related components need to be rendered within a proper table structure
 * to function correctly. This helper ensures components are rendered in the right context.
 * 
 * @param ui - The React component to render (typically a table row or cell)
 * @returns The standard render result object from Testing Library
 */
export const renderWithTableContext = (ui: React.ReactElement): RenderResult => {
  return render(
    <table>
      <tbody>
        {ui}
      </tbody>
    </table>
  );
};

/**
 * Creates a delay using a promise
 * 
 * Useful for tests that need to wait for a specific duration
 * 
 * @param ms - The number of milliseconds to delay
 * @returns A promise that resolves after the specified delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Helper to create a mock HTMLElement
 * 
 * Useful for testing focus management and event handling
 * 
 * @param tag - The HTML tag name to create
 * @param props - Additional properties to apply to the element
 * @returns The created HTMLElement
 */
export const createMockElement = (tag: string, props: Record<string, any> = {}): HTMLElement => {
  const element = document.createElement(tag);
  
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value as string;
    } else if (key === 'textContent') {
      element.textContent = value as string;
    } else {
      element.setAttribute(key, value as string);
    }
  });
  
  return element;
};
