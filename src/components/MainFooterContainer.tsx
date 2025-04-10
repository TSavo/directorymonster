'use client';

import React from 'react';
import { useMainFooter, SiteInfo } from './hooks/useMainFooter';
import { MainFooterPresentation } from './MainFooterPresentation';

export interface MainFooterContainerProps {
  site: SiteInfo;
}

/**
 * MainFooterContainer Component
 * 
 * Container component that connects the hook and presentation components
 */
export function MainFooterContainer({ site }: MainFooterContainerProps) {
  // Use the hook to get data and handlers
  const footerData = useMainFooter({ site });
  
  // Return the presentation component with props from hook
  return <MainFooterPresentation {...footerData} />;
}
