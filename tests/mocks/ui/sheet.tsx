import React from 'react';

interface SheetProps {
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  [prop: string]: any;
}

export const Sheet: React.FC<SheetProps> = ({
  children,
  className = '',
  open = false,
  onOpenChange = () => {},
  ...props
}) => {
  return (
    <div 
      className={`ui-sheet ${className}`} 
      data-testid="ui-sheet"
      data-state={open ? 'open' : 'closed'}
      {...props}
    >
      {children}
    </div>
  );
};

export const SheetTrigger: React.FC<SheetProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <button 
      className={`ui-sheet-trigger ${className}`} 
      data-testid="ui-sheet-trigger"
      {...props}
    >
      {children}
    </button>
  );
};

export const SheetContent: React.FC<SheetProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`ui-sheet-content ${className}`} 
      data-testid="ui-sheet-content"
      {...props}
    >
      {children}
    </div>
  );
};

export const SheetHeader: React.FC<SheetProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`ui-sheet-header ${className}`} 
      data-testid="ui-sheet-header"
      {...props}
    >
      {children}
    </div>
  );
};

export const SheetTitle: React.FC<SheetProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3 
      className={`ui-sheet-title ${className}`} 
      data-testid="ui-sheet-title"
      {...props}
    >
      {children}
    </h3>
  );
};

export const SheetDescription: React.FC<SheetProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p 
      className={`ui-sheet-description ${className}`} 
      data-testid="ui-sheet-description"
      {...props}
    >
      {children}
    </p>
  );
};

export const SheetFooter: React.FC<SheetProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`ui-sheet-footer ${className}`} 
      data-testid="ui-sheet-footer"
      {...props}
    >
      {children}
    </div>
  );
};

export const SheetClose: React.FC<SheetProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <button 
      className={`ui-sheet-close ${className}`} 
      data-testid="ui-sheet-close"
      {...props}
    >
      {children}
    </button>
  );
};

export default Sheet;