'use client';

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
export default function ListingTable({ siteSlug, initialListings }: ListingTableProps) {
  const {
    // Data
    filteredListings,
    currentListings,
    categories,
    sites,
    
    // Loading and error states
    isLoading,
    error,
    
    // Filtering
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    siteFilter,
    setSiteFilter,
    
    // Sorting
    sortField,
    sortOrder,
    handleSort,
    
    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    goToPage,
    
    // Delete handling
    isDeleteModalOpen,
    listingToDelete,
    confirmDelete,
    handleDelete,
    cancelDelete,
    
    // Refetch
    fetchListings
  } = useListings(siteSlug, initialListings);

  // Show site column only in multi-site mode
  const showSiteColumn = !siteSlug;

  // Render loading state
  if (isLoading) {
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
        totalListings={filteredListings.length}
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
      {filteredListings.length === 0 && (
        <ListingTableEmptyState siteSlug={siteSlug} />
      )}
      
      {/* Table for desktop */}
      {filteredListings.length > 0 && (
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
            setItemsPerPage={setItemsPerPage}
            totalItems={filteredListings.length}
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
