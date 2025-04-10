import * as React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  delayDuration?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

export function Tooltip({ 
  children, 
  content, 
  delayDuration = 300, 
  side = 'top', 
  className = '' 
}: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(false);
  };

  return (
    <div 
      className={`ui-tooltip-provider ${className}`}
      data-testid="tooltip"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="ui-tooltip-trigger" data-testid="tooltip-trigger">
        {children}
      </div>
      {isOpen && (
        <div 
          className={`ui-tooltip-content`} 
          data-testid="tooltip-content"
          data-side={side}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children, asChild, className = '' }: TooltipTriggerProps) {
  return (
    <div className={`ui-tooltip-trigger ${className}`} data-testid="tooltip-trigger">
      {children}
    </div>
  );
}

export function TooltipContent({ 
  children, 
  className = '', 
  side = 'top', 
  sideOffset = 4 
}: TooltipContentProps) {
  return (
    <div 
      className={`ui-tooltip-content ${className}`} 
      data-testid="tooltip-content"
      data-side={side}
      style={{ ['--side-offset' as any]: `${sideOffset}px` }}
    >
      {children}
    </div>
  );
}
