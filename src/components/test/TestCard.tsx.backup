import React from 'react';

interface TestCardProps {
  title: string;
  content: string;
  footer?: string;
  onCardClick?: () => void;
}

const TestCard: React.FC<TestCardProps> = ({ 
  title, 
  content, 
  footer,
  onCardClick 
}) => {
  return (
    <div className="test-card" data-testid="test-card" onClick={onCardClick}>
      <div className="card-header">
        <h3 data-testid="card-title">{title}</h3>
      </div>
      <div className="card-body">
        <p data-testid="card-content">{content}</p>
      </div>
      {footer && (
        <div className="card-footer" data-testid="card-footer">
          <small data-testid="footer-text">{footer}</small>
        </div>
      )}
    </div>
  );
};

export default TestCard;
