import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  [prop: string]: any;
}

export const Label: React.FC<LabelProps> = ({
  children,
  className = '',
  htmlFor,
  ...props
}) => {
  return (
    <label 
      htmlFor={htmlFor}
      className={`ui-label ${className}`} 
      data-testid="ui-label"
      {...props}
    >
      {children}
    </label>
  );
};

export default Label;