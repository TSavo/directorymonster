'use client';

import React from 'react';
import { MainFooterContainer } from './MainFooterContainer';
import { SiteInfo } from './hooks/useMainFooter';

export interface MainFooterProps {
  site: SiteInfo;
}

/**
 * MainFooter Component
 *
 * This component displays the main footer of the site with links, contact info, and copyright.
 * It has been refactored to use a container/presentation pattern for better testability.
 */
export default function MainFooter({ site }: MainFooterProps) {
  return <MainFooterContainer site={site} />;
}
