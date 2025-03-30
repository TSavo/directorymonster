import React from 'react';

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  type?: 'single' | 'multiple';
  [prop: string]: any;
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  className = '',
  defaultValue,
  value,
  onValueChange = () => {},
  type = 'single',
  ...props
}) => {
  return (
    <div 
      className={`ui-accordion ${className}`} 
      data-testid="ui-accordion"
      {...props}
    >
      {children}
    </div>
  );
};

interface AccordionItemProps {
  children: React.ReactNode;
  className?: string;
  value: string;
  [prop: string]: any;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  children,
  className = '',
  value,
  ...props
}) => {
  return (
    <div 
      className={`ui-accordion-item ${className}`} 
      data-testid="ui-accordion-item"
      data-value={value}
      {...props}
    >
      {children}
    </div>
  );
};

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
  [prop: string]: any;
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <button 
      className={`ui-accordion-trigger ${className}`} 
      data-testid="ui-accordion-trigger"
      {...props}
    >
      {children}
    </button>
  );
};

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
  forceMount?: boolean;
  [prop: string]: any;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({
  children,
  className = '',
  forceMount = false,
  ...props
}) => {
  return (
    <div 
      className={`ui-accordion-content ${className}`} 
      data-testid="ui-accordion-content"
      {...props}
    >
      {children}
    </div>
  );
};

export default Accordion;