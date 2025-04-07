import React, { ReactNode } from 'react';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const useTheme = () => ({
  theme: 'light',
  setTheme: jest.fn(),
  systemTheme: 'light',
});
