'use client';

import { useState, useCallback } from 'react';
import { useListings } from './hooks/useListings';
import { ListingTableProps } from './types';
import {
  DeleteConfirmationModal,
  ListingTableActions,
  ListingTableEmptyState,
  ListingTableError,
  ListingTableHeader,
  ListingTablePagination,
  ListingTableRow,
  ListingTableSkeleton,
  ListingTableSortHeader,
  ListingsMobileView
} from './components';

/**
 * ListingTable - A comprehensive table component for managing listings
 * 
 * Features:
 * - Sorting (click column headers)
 * - Filtering (by category, search term)
 * - Pagination
 * - CRUD operations (view, edit, delete)
 * - Responsive design (mobile view for smaller screens)
 * - Loading states with skeletons
 * - Error handling with retry options
 * - ARIA accessibility
 */
export function ListingTable({ siteSlug, initialListings }: ListingTableProps) {
  const {
    listings,
    loading,
    error,
    filters,
    setSearchTerm,
    filterByCategory: setCategoryFilter,
    filterBySite: setSiteFilter,
    sort,
    setSorting,
    pagination,
    setPage,
    setPerPage,
    toggleSelection,
    deleteListing,
    fetchListings
  } = useListings({
    siteSlug,
    initialListings // Pass initialListings to useListings
  });

  // Aliases and derived values
  const filteredListings = listings;
  const currentListings = listings;
  const isLoading = loading;
  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const itemsPerPage = pagination?.perPage || 10;
  const sortField = sort?.field;
  const sortOrder = sort?.direction;
  const goToPage = setPage;
  const handleSort = setSorting;
  const handleDelete = deleteListing;
  
  // For delete modal functionality
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<any>(null);
  
  const confirmDelete = useCallback((listing: any) => {
    setListingToDelete(listing);
    setIsDeleteModalOpen(true);
  }, []);
  
  const cancelDelete = useCallback(() => {
    setIsDeleteModalOpen(false);
    setListingToDelete(null);
  }, []);

  // Filter values for header component
  const searchTerm = filters?.search || '';
  const categoryFilter = filters?.categoryIds?.[0] || '';
  const siteFilter = filters?.siteId || '';
  
  // Mock data for testing - should come from API in production
  const categories = []; // Should be populated from API
  const sites = []; // Should be populated from API

  // Show site column only in multi-site mode
  const showSiteColumn = !siteSlug;

  // Render loading state - only show if loading and no initialListings provided
  if (isLoading && !initialListings?.length) {
    return <ListingTableSkeleton />;
  }

  // Render error state
  if (error) {
    return <ListingTableError error={error} onRetry={fetchListings} />;
  }

  return (
    <div className="w-full p-4">
      {/* Header with search and filters */}
      <ListingTableHeader
        totalListings={filteredListings?.length || 0}
        siteSlug={siteSlug}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        siteFilter={siteFilter}
        setSiteFilter={setSiteFilter}
        categories={categories}
        sites={sites}
      />
      
      {/* Empty state */}
      {filteredListings?.length === 0 && (
        <ListingTableEmptyState siteSlug={siteSlug} />
      )}
      
      {/* Table for desktop */}
      {filteredListings?.length > 0 && (
        <>
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <table className="w-full divide-y divide-gray-200" aria-label="Listings table">
              <thead className="bg-gray-50">
                <tr>
                  <ListingTableSortHeader
                    label="Title"
                    field="title"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <ListingTableSortHeader
                    label="Category"
                    field="categoryName"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  {showSiteColumn && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Site
                    </th>
                  )}
                  <ListingTableSortHeader
                    label="Last Updated"
                    field="updatedAt"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <ListingTableSortHeader
                    label="Backlink Status"
                    field="backlinkVerifiedAt"
                    currentSortField={sortField}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentListings.map((listing) => (
                  <ListingTableRow
                    key={listing.id}
                    listing={listing}
                    siteSlug={siteSlug}
                    showSiteColumn={showSiteColumn}
                    onDeleteClick={confirmDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile view */}
          <ListingsMobileView 
            listings={currentListings} 
            showSiteColumn={showSiteColumn} 
            onDeleteClick={confirmDelete}
            siteSlug={siteSlug}
          />
          
          {/* Pagination */}
          <ListingTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            goToPage={goToPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setPerPage}
            totalItems={filteredListings?.length || 0}
          />
        </>
      )}
      
      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Listing"
        itemName={listingToDelete?.title || ''}
        onConfirm={() => listingToDelete && handleDelete(listingToDelete.id)}
        onCancel={cancelDelete}
      />
    </div>
  );
}

// Enable both named and default exports
export default ListingTable;
