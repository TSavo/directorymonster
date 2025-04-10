import * as React from 'react';

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function Tabs({ children, defaultValue, value, onValueChange, className = '' }: TabsProps) {
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || '');

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setSelectedValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <div className={`ui-tabs ${className}`} data-testid="tabs" data-value={selectedValue}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            selectedValue,
            onValueChange: handleValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div className={`ui-tabs-list ${className}`} role="tablist" data-testid="tabs-list">
      {children}
    </div>
  );
}

export function TabsTrigger({ children, value, className = '' }: TabsTriggerProps) {
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const parent = e.currentTarget.closest('[data-testid="tabs"]') as HTMLElement;
    const onValueChange = (parent as any)?.onValueChange;
    if (typeof onValueChange === 'function') {
      onValueChange(value);
    }
  };

  const isSelected = (e: React.MouseEvent) => {
    const parent = e.currentTarget.closest('[data-testid="tabs"]') as HTMLElement;
    return parent?.getAttribute('data-value') === value;
  };

  return (
    <button
      className={`ui-tabs-trigger ${className}`}
      role="tab"
      data-testid="tabs-trigger"
      data-value={value}
      onClick={onClick}
      aria-selected={isSelected}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, className = '' }: TabsContentProps) {
  const isVisible = (parent: HTMLElement | null) => {
    if (!parent) return false;
    return parent.getAttribute('data-value') === value;
  };

  return (
    <div
      className={`ui-tabs-content ${className}`}
      role="tabpanel"
      data-testid="tabs-content"
      data-value={value}
      hidden={!isVisible(document?.querySelector('[data-testid="tabs"]'))}
    >
      {children}
    </div>
  );
}
