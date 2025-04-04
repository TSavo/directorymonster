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
      <h2 data-testid="test-title">{title}</h2>
      <p data-testid="test-description">{description}</p>
      <button
        className="test-button"
        data-testid="test-button"
        onClick={onButtonClick}
      >
        Click Me
      </button>
    </div>
  );
};

export default TestComponent;
