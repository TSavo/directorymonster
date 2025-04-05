import React from 'react';

export const Map = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-map">{children}</div>
);

export const Marker = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-marker">{children}</div>
);

export const Popup = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-popup">{children}</div>
);

export const NavigationControl = () => (
  <div data-testid="mock-nav-control" />
);

export default {
  Map,
  Marker,
  Popup,
  NavigationControl
};
