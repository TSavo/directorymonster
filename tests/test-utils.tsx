import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NotificationProvider } from './mocks/notification-provider-mock';

// Custom render function that wraps components with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <NotificationProvider>
        {children}
      </NotificationProvider>
    ),
    ...options
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };
