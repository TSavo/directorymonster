import React from 'react';

export const Dialog = ({ children, open, onOpenChange, ...props }: any) => {
  if (!open) return null;
  return (
    <div className="dialog" {...props}>
      {children}
    </div>
  );
};

export const DialogTrigger = ({ children, ...props }: any) => (
  <div className="dialog-trigger" {...props}>
    {children}
  </div>
);

export const DialogContent = ({ children, className, ...props }: any) => (
  <div className={`dialog-content ${className || ''}`} {...props}>
    {children}
  </div>
);

export const DialogHeader = ({ children, className, ...props }: any) => (
  <div className={`dialog-header ${className || ''}`} {...props}>
    {children}
  </div>
);

export const DialogFooter = ({ children, className, ...props }: any) => (
  <div className={`dialog-footer ${className || ''}`} {...props}>
    {children}
  </div>
);

export const DialogTitle = ({ children, className, ...props }: any) => (
  <h2 className={`dialog-title ${className || ''}`} {...props}>
    {children}
  </h2>
);

export const DialogDescription = ({ children, className, ...props }: any) => (
  <p className={`dialog-description ${className || ''}`} {...props}>
    {children}
  </p>
);
