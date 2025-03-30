import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  [prop: string]: any;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`ui-card ${className}`} 
      data-testid="ui-card"
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`ui-card-header ${className}`} 
      data-testid="ui-card-header"
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3 
      className={`ui-card-title ${className}`} 
      data-testid="ui-card-title"
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p 
      className={`ui-card-description ${className}`} 
      data-testid="ui-card-description"
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`ui-card-content ${className}`} 
      data-testid="ui-card-content"
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`ui-card-footer ${className}`} 
      data-testid="ui-card-footer"
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;