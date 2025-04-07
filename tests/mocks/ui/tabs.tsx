import React from 'react';

export const Tabs = ({ defaultValue, children }: { defaultValue: string, children: React.ReactNode }) => (
  <div className="tabs" data-default-value={defaultValue}>{children}</div>
);

export const TabsList = ({ children }: { children: React.ReactNode }) => (
  <div className="tabs-list">{children}</div>
);

export const TabsTrigger = ({ value, children }: { value: string, children: React.ReactNode }) => (
  <button className="tabs-trigger" data-value={value}>{children}</button>
);

export const TabsContent = ({ value, children }: { value: string, children: React.ReactNode }) => (
  <div className="tabs-content" data-value={value}>{children}</div>
);
