'use client';

import React from 'react';
import { UseMainLayoutProps } from './hooks/useMainLayout';
import { MainLayoutContainer } from './MainLayoutContainer';

export interface MainLayoutProps extends UseMainLayoutProps {}

export default function MainLayout(props: MainLayoutProps) {
  return <MainLayoutContainer {...props} />;
}
