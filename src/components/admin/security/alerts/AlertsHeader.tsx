'use client';

import React from 'react';

interface AlertsHeaderProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const AlertsHeader: React.FC<AlertsHeaderProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div data-testid="alerts-tabs">
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => onTabChange('all')}
          className={`px-4 py-2 ${activeTab === 'all' ? 'border-b-2 border-blue-500' : ''}`}
          data-testid="tab-all"
          data-state={activeTab === 'all' ? 'active' : 'inactive'}
        >
          All Alerts
        </button>
        <button
          onClick={() => onTabChange('new')}
          className={`px-4 py-2 ${activeTab === 'new' ? 'border-b-2 border-blue-500' : ''}`}
          data-testid="tab-new"
          data-state={activeTab === 'new' ? 'active' : 'inactive'}
        >
          New
        </button>
        <button
          onClick={() => onTabChange('acknowledged')}
          className={`px-4 py-2 ${activeTab === 'acknowledged' ? 'border-b-2 border-blue-500' : ''}`}
          data-testid="tab-acknowledged"
          data-state={activeTab === 'acknowledged' ? 'active' : 'inactive'}
        >
          Acknowledged
        </button>
        <button
          onClick={() => onTabChange('resolved')}
          className={`px-4 py-2 ${activeTab === 'resolved' ? 'border-b-2 border-blue-500' : ''}`}
          data-testid="tab-resolved"
          data-state={activeTab === 'resolved' ? 'active' : 'inactive'}
        >
          Resolved
        </button>
      </div>
    </div>
  );
};

export default AlertsHeader;
