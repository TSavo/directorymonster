import React from 'react';

export const Tooltip = ({ children, content }: any) => (
  <div data-testid="tooltip" data-tooltip-content={content}>
    {children}
  </div>
);

export const TooltipTrigger = ({ children }: any) => (
  <div data-testid="tooltip-trigger">{children}</div>
);

export const TooltipContent = ({ children }: any) => (
  <div data-testid="tooltip-content">{children}</div>
);

export const TooltipProvider = ({ children }: any) => (
  <div data-testid="tooltip-provider">{children}</div>
);
