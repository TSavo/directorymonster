'use client';

import React from 'react';
import { SiteTableContainer } from './SiteTableContainer';

export interface SiteTableProps {
  /**
   * API endpoint for fetching sites
   */
  apiEndpoint?: string;
}

/**
 * SiteTable - Table for listing and managing sites
 *
 * This component has been refactored to use a container/presentation pattern
 * for better separation of concerns, testability, and maintainability.
 *
 * Features:
 * - Displays all sites with key information
 * - Provides links to edit and manage sites
 * - Handles loading and error states
 * - Supports filtering, sorting, and pagination
 * - Responsive design with mobile view
 */
export function SiteTable({
  apiEndpoint = '/api/sites'
}: SiteTableProps) {
  return (
    <SiteTableContainer
      apiEndpoint={apiEndpoint}
    />
  );
}

export default SiteTable;