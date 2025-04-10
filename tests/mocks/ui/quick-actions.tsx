import React from 'react';

export const QuickActions = ({ children }: any) => (
  <div data-testid="quick-actions">{children}</div>
);

export const QuickAction = ({ icon, label, onClick }: any) => (
  <button onClick={onClick} data-testid={`quick-action-${label}`}>
    {icon}
    {label}
  </button>
);

export const QuickActionsMenu = () => {
  return (
    <div data-testid="quick-actions-menu" className="quick-actions">
      <QuickActions>
        <QuickAction icon={<span>📝</span>} label="Edit" onClick={() => {}} />
        <QuickAction icon={<span>🗑️</span>} label="Delete" onClick={() => {}} />
      </QuickActions>
    </div>
  );
};
