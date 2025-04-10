'use client';

import React, { ReactNode } from 'react';
import MainHeader from './MainHeader';
import MainFooter from './MainFooter';
import { Site, Category } from './hooks/useMainLayout';

export interface MainLayoutPresentationProps {
  children: ReactNode;
  site: Site;
  categories: Category[];
}

export function MainLayoutPresentation({
  children,
  site,
  categories
}: MainLayoutPresentationProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader site={site} categories={categories} />
      <main className="flex-grow">
        {children}
      </main>
      <MainFooter site={site} />
    </div>
  );
}

export default MainLayoutPresentation;
