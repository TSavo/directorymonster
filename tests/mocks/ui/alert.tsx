import React from 'react';

export const Alert = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`alert ${className || ''}`}>{children}</div>
);

export const AlertTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="alert-title">{children}</div>
);

export const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="alert-description">{children}</div>
);
