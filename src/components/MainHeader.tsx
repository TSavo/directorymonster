'use client';

import React from 'react';
import { MainHeaderContainer } from './MainHeaderContainer';
import { SiteInfo, CategoryInfo } from './MainHeaderPresentation';

export interface MainHeaderProps {
  site: SiteInfo;
  categories?: CategoryInfo[];
}

/**
 * MainHeader Component
 *
 * This component displays the main header of the site with navigation, search, and user controls.
 * It has been refactored to use a container/presentation pattern for better testability.
 */
export default function MainHeader({ site, categories = [] }: MainHeaderProps) {
  return <MainHeaderContainer site={site} categories={categories} />;
}
