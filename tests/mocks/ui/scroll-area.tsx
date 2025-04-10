import React from 'react';

export const ScrollArea = ({ children }: any) => (
  <div data-testid="scroll-area">{children}</div>
);

export const ScrollBar = ({ orientation = 'vertical' }: any) => (
  <div data-testid={`scroll-bar-${orientation}`}></div>
);
