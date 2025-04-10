import * as React from 'react';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  type?: 'auto' | 'always' | 'scroll' | 'hover';
  viewportClassName?: string;
}

interface ScrollBarProps {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function ScrollArea({
  children,
  className = '',
  type = 'auto',
  viewportClassName = ''
}: ScrollAreaProps) {
  return (
    <div 
      className={`ui-scroll-area ${className}`} 
      data-testid="scroll-area" 
      data-type={type}
    >
      <div 
        className={`ui-scroll-area-viewport ${viewportClassName}`} 
        data-testid="scroll-area-viewport"
      >
        {children}
      </div>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
    </div>
  );
}

export function ScrollBar({
  orientation = 'vertical',
  className = ''
}: ScrollBarProps) {
  return (
    <div 
      className={`ui-scrollbar ${className} ui-scrollbar-${orientation}`}
      data-testid="scrollbar"
      data-orientation={orientation}
    >
      <div className="ui-scrollbar-thumb" data-testid="scrollbar-thumb"></div>
    </div>
  );
}
