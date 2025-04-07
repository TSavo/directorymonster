/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import KeyboardShortcut, { formatShortcut } from '../KeyboardShortcut';

describe('KeyboardShortcut Component', () => {
  it('triggers callback when the correct key combination is pressed', () => {
    const mockCallback = jest.fn();
    
    render(
      <KeyboardShortcut
        combination={{ key: 'a', ctrlKey: true }}
        onKeyDown={mockCallback}
      />
    );
    
    // Simulate pressing Ctrl+A
    fireEvent.keyDown(document, {
      key: 'a',
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    });
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
  
  it('does not trigger callback when a different key is pressed', () => {
    const mockCallback = jest.fn();
    
    render(
      <KeyboardShortcut
        combination={{ key: 'a', ctrlKey: true }}
        onKeyDown={mockCallback}
      />
    );
    
    // Simulate pressing Ctrl+B (wrong key)
    fireEvent.keyDown(document, {
      key: 'b',
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    });
    
    expect(mockCallback).not.toHaveBeenCalled();
  });
  
  it('does not trigger callback when modifier keys do not match', () => {
    const mockCallback = jest.fn();
    
    render(
      <KeyboardShortcut
        combination={{ key: 'a', ctrlKey: true }}
        onKeyDown={mockCallback}
      />
    );
    
    // Simulate pressing A without Ctrl (wrong modifier)
    fireEvent.keyDown(document, {
      key: 'a',
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    });
    
    expect(mockCallback).not.toHaveBeenCalled();
  });
  
  it('does not trigger callback when disabled', () => {
    const mockCallback = jest.fn();
    
    render(
      <KeyboardShortcut
        combination={{ key: 'a', ctrlKey: true }}
        onKeyDown={mockCallback}
        disabled={true}
      />
    );
    
    // Simulate pressing Ctrl+A
    fireEvent.keyDown(document, {
      key: 'a',
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    });
    
    expect(mockCallback).not.toHaveBeenCalled();
  });
  
  it('is case-insensitive for key matching', () => {
    const mockCallback = jest.fn();
    
    render(
      <KeyboardShortcut
        combination={{ key: 'a', ctrlKey: true }}
        onKeyDown={mockCallback}
      />
    );
    
    // Simulate pressing Ctrl+A (uppercase)
    fireEvent.keyDown(document, {
      key: 'A',
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    });
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
  
  describe('formatShortcut function', () => {
    it('formats simple key combinations', () => {
      expect(formatShortcut({ key: 'a' })).toBe('A');
      expect(formatShortcut({ key: 'Enter' })).toBe('Enter');
      expect(formatShortcut({ key: ' ' })).toBe('Space');
    });
    
    it('formats combinations with modifier keys', () => {
      expect(formatShortcut({ key: 'a', ctrlKey: true })).toBe('Ctrl + A');
      expect(formatShortcut({ key: 'b', altKey: true })).toBe('Alt + B');
      expect(formatShortcut({ key: 'c', shiftKey: true })).toBe('Shift + C');
      expect(formatShortcut({ key: 'd', metaKey: true })).toBe('⌘ + D');
    });
    
    it('formats combinations with multiple modifier keys', () => {
      expect(formatShortcut({ key: 'a', ctrlKey: true, altKey: true })).toBe('Ctrl + Alt + A');
      expect(formatShortcut({ key: 'b', ctrlKey: true, shiftKey: true })).toBe('Ctrl + Shift + B');
      expect(formatShortcut({ key: 'c', ctrlKey: true, altKey: true, shiftKey: true })).toBe('Ctrl + Alt + Shift + C');
      expect(formatShortcut({ key: 'd', ctrlKey: true, altKey: true, shiftKey: true, metaKey: true })).toBe('Ctrl + Alt + Shift + ⌘ + D');
    });
    
    it('formats arrow keys correctly', () => {
      expect(formatShortcut({ key: 'ArrowUp' })).toBe('↑');
      expect(formatShortcut({ key: 'ArrowDown' })).toBe('↓');
      expect(formatShortcut({ key: 'ArrowLeft' })).toBe('←');
      expect(formatShortcut({ key: 'ArrowRight' })).toBe('→');
    });
  });
});
