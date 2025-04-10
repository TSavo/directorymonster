import React from 'react';

export function AlertDialog({ children }: { children: React.ReactNode }) {
  return <div data-testid="alert-dialog">{children}</div>;
}

export function AlertDialogTrigger({ children }: { children: React.ReactNode }) {
  return <div data-testid="alert-dialog-trigger">{children}</div>;
}

export function AlertDialogContent({ children }: { children: React.ReactNode }) {
  return <div data-testid="alert-dialog-content">{children}</div>;
}

export function AlertDialogHeader({ children }: { children: React.ReactNode }) {
  return <div data-testid="alert-dialog-header">{children}</div>;
}

export function AlertDialogFooter({ children }: { children: React.ReactNode }) {
  return <div data-testid="alert-dialog-footer">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: React.ReactNode }) {
  return <div data-testid="alert-dialog-title">{children}</div>;
}

export function AlertDialogDescription({ children }: { children: React.ReactNode }) {
  return <div data-testid="alert-dialog-description">{children}</div>;
}

export function AlertDialogCancel({ children }: { children: React.ReactNode }) {
  return <button data-testid="alert-dialog-cancel">{children}</button>;
}

export function AlertDialogAction({ children }: { children: React.ReactNode }) {
  return <button data-testid="alert-dialog-action">{children}</button>;
}
