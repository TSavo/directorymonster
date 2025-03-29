# Accessibility Testing Guide

This document outlines the accessibility testing approach for DirectoryMonster, ensuring our application is usable by everyone, including people with disabilities.

## Table of Contents

1. [Accessibility Standards](#accessibility-standards)
2. [Testing Tools](#testing-tools)
3. [Testing Process](#testing-process)
4. [Component-Level Tests](#component-level-tests)
5. [Page-Level Tests](#page-level-tests)
6. [Common Issues](#common-issues)
7. [Resources](#resources)

## Accessibility Standards

DirectoryMonster aims to meet WCAG 2.1 AA compliance, which includes:

- **Perceivable**: Information and UI components must be presentable to users in ways they can perceive
- **Operable**: UI components and navigation must be operable
- **Understandable**: Information and operation of the UI must be understandable
- **Robust**: Content must be robust enough to be interpreted reliably by a wide variety of user agents, including assistive technologies

## Testing Tools

The following tools are used for accessibility testing:

1. **Jest + Testing Library**: For automated component-level accessibility testing
2. **jest-axe**: For automated accessibility rule checking
3. **Manual Testing**: Using screen readers and keyboard navigation
4. **Browser Extensions**: Lighthouse, axe DevTools, and WAVE

## Testing Process

### Automated Testing

1. **Component Accessibility Testing**: Using jest-axe to verify components meet accessibility standards
2. **Keyboard Navigation Testing**: Ensuring all interactive elements are accessible via keyboard
3. **Screen Reader Testing**: Testing components with screen reader simulation

### Manual Testing

1. **Keyboard Navigation**: Tab through the entire application
2. **Screen Reader Testing**: Using NVDA, VoiceOver, or other screen readers
3. **Visual Inspection**: Checking color contrast, text sizes, and focus states

## Component-Level Tests

All React components should be tested for accessibility with the following patterns:

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import MyComponent from './MyComponent';

expect.extend(toHaveNoViolations);

describe('MyComponent Accessibility', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('supports keyboard navigation', async () => {
    const { getByRole } = render(<MyComponent />);
    const button = getByRole('button');
    
    // Check tab focus
    expect(document.body).toHaveFocus();
    userEvent.tab();
    expect(button).toHaveFocus();
  });
});
```

### Focus Management

Test focus management for modal dialogs and other interactive components:

```tsx
it('properly traps focus within modal dialog', async () => {
  const user = userEvent.setup();
  render(<ModalDialog isOpen={true} />);
  
  // Initial focus should be on the first focusable element
  expect(document.activeElement).toBe(screen.getByTestId('modal-close-button'));
  
  // Tab to next element
  await user.tab();
  expect(document.activeElement).toBe(screen.getByTestId('modal-confirm-button'));
  
  // Tab again should cycle back to first element (focus trap)
  await user.tab();
  expect(document.activeElement).toBe(screen.getByTestId('modal-close-button'));
  
  // Test escape key closes modal
  await user.keyboard('{Escape}');
  expect(screen.queryByTestId('modal-dialog')).not.toBeInTheDocument();
});
```

## Page-Level Tests

Page-level accessibility tests should check for overall page structure:

```tsx
it('has proper page structure', async () => {
  render(<MyPage />);
  
  // Check for heading structure
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  
  // Check for landmarks
  expect(screen.getByRole('navigation')).toBeInTheDocument();
  expect(screen.getByRole('main')).toBeInTheDocument();
  
  // Run axe tests
  const results = await axe(document.body);
  expect(results).toHaveNoViolations();
});
```

## Common Issues

1. **Missing Alt Text**: All images must have appropriate alt text
2. **Keyboard Traps**: Ensure users can navigate out of components using keyboard
3. **Low Contrast**: Text must have sufficient contrast with its background
4. **Missing Form Labels**: All form inputs must have associated labels
5. **Improper ARIA Usage**: ARIA attributes must be used correctly
6. **Inconsistent Focus States**: Focus states should be visible and consistent

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Testing Library Accessibility](https://testing-library.com/docs/dom-testing-library/api-accessibility/)
- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)
- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
