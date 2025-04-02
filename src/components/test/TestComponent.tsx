import React from 'react';

interface TestComponentProps {
  title: string;
  description: string;
  onButtonClick: () => void;
}

const TestComponent: React.FC<TestComponentProps> = ({ 
  title, 
  description, 
  onButtonClick 
}) => {
  return (
    <div className="test-component">
      <h2>{title}</h2>
      <p>{description}</p>
      <button 
        className="test-button"
        onClick={onButtonClick}
      >
        Click Me
      </button>
    </div>
  );
};

export default TestComponent;
