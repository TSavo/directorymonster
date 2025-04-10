import React from 'react';

export const Tabs = ({ defaultValue, children }: { defaultValue: string, children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <div className="tabs" data-default-value={defaultValue} data-testid="tabs">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === TabsList) {
            return React.cloneElement(child, { activeTab, setActiveTab });
          }
          if (child.type === TabsContent) {
            return React.cloneElement(child, {
              style: { display: child.props.value === activeTab ? 'block' : 'none' }
            });
          }
        }
        return child;
      })}
    </div>
  );
};

export const TabsList = ({ children, activeTab, setActiveTab }: any) => (
  <div className="tabs-list" role="tablist" data-testid="tabs-list">
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === TabsTrigger) {
        return React.cloneElement(child, {
          active: child.props.value === activeTab,
          onClick: () => setActiveTab(child.props.value)
        });
      }
      return child;
    })}
  </div>
);

export const TabsTrigger = ({ value, children, active, onClick }: any) => (
  <button
    className={`tabs-trigger ${active ? 'active' : ''}`}
    data-value={value}
    role="tab"
    aria-selected={active}
    data-testid={`tab-${value}`}
    onClick={onClick}
  >
    {children}
  </button>
);

export const TabsContent = ({ value, children, style }: any) => (
  <div
    className="tabs-content"
    data-value={value}
    role="tabpanel"
    data-testid={`tab-content-${value}`}
    style={style}
  >
    {children}
  </div>
);
