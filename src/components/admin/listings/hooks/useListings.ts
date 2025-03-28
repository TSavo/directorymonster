'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, SiteConfig } from '@/types';
import { ListingWithRelations, SortField, SortOrder } from '../types';

/**
 * Custom hook for managing listings data with filtering, sorting and pagination
 */
export function useListings(siteSlug?: string, initialListings?: ListingWithRelations[]) {
  // State for listings data
  const [listings, setListings] = useState<ListingWithRelations[]>(initialListings || []);
  const [filteredListings, setFilteredListings] = useState<ListingWithRelations[]>([]);
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState<boolean>(!initialListings);
  const [error, setError] = useState<string | null>(null);
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [siteFilter, setSiteFilter] = useState<string>(siteSlug || '');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  
  // State for available categories and sites
  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<SiteConfig[]>([]);
  
  // State for dialog
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [listingToDelete, setListingToDelete] = useState<{ id: string; title: string } | null>(null);

  // Fetch listings data
  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // If siteSlug is provided, fetch listings only for that site
      const endpoint = siteSlug 
        ? `/api/sites/${siteSlug}/listings` 
        : '/api/listings'; // Note: This endpoint may need to be implemented
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Enrich listings with category and site names
      const enrichedListings = await Promise.all(data.map(async (listing: ListingWithRelations) => {
        const categoryResponse = await fetch(`/api/sites/${siteSlug || listing.siteId}/categories`);
        const categories = categoryResponse.ok ? await categoryResponse.json() : [];
        
        const category = categories.find((cat: Category) => cat.id === listing.categoryId);
        
        // If we're in multi-site mode, fetch site details
        let siteName = '';
        if (!siteSlug) {
          const siteResponse = await fetch(`/api/sites/${listing.siteId}`);
          if (siteResponse.ok) {
            const site = await siteResponse.json();
            siteName = site.name;
          }
        }
        
        return {
          ...listing,
          categoryName: category ? category.name : 'Unknown Category',
          siteName: siteName || 'Unknown Site',
        };
      }));
      
      setListings(enrichedListings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching listings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [siteSlug]);

  // Fetch categories for filtering
  const fetchCategories = useCallback(async () => {
    if (!siteSlug) return; // Don't fetch categories if no site is selected
    
    try {
      const response = await fetch(`/api/sites/${siteSlug}/categories`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [siteSlug]);

  // Fetch sites for filtering in multi-site mode
  const fetchSites = useCallback(async () => {
    if (siteSlug) return; // Don't fetch sites if a site is already selected
    
    try {
      const response = await fetch('/api/sites');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sites: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSites(data);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  }, [siteSlug]);

  // Handle deletion of a listing
  const handleDelete = async (id: string) => {
    try {
      const endpoint = siteSlug 
        ? `/api/sites/${siteSlug}/listings/${id}` 
        : `/api/listings/${id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete listing: ${response.statusText}`);
      }
      
      // Remove the listing from the state
      setListings(prevListings => prevListings.filter(listing => listing.id !== id));
      setIsDeleteModalOpen(false);
      setListingToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while deleting');
      console.error('Error deleting listing:', err);
    }
  };

  // Open delete confirmation modal
  const confirmDelete = (id: string, title: string) => {
    setListingToDelete({ id, title });
    setIsDeleteModalOpen(true);
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setListingToDelete(null);
  };

  // Filter, sort, and paginate listings
  useEffect(() => {
    // Apply filters
    let result = [...listings];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(listing => 
        listing.title.toLowerCase().includes(term) ||
        listing.metaDescription.toLowerCase().includes(term) ||
        (listing.categoryName && listing.categoryName.toLowerCase().includes(term))
      );
    }
    
    if (categoryFilter) {
      result = result.filter(listing => listing.categoryId === categoryFilter);
    }
    
    if (siteFilter && !siteSlug) {
      result = result.filter(listing => listing.siteId === siteFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valA, valB;
      
      switch (sortField) {
        case 'title':
          valA = a.title;
          valB = b.title;
          break;
        case 'categoryName':
          valA = a.categoryName || '';
          valB = b.categoryName || '';
          break;
        case 'createdAt':
          valA = a.createdAt;
          valB = b.createdAt;
          break;
        case 'updatedAt':
          valA = a.updatedAt;
          valB = b.updatedAt;
          break;
        case 'backlinkVerifiedAt':
          valA = a.backlinkVerifiedAt || 0;
          valB = b.backlinkVerifiedAt || 0;
          break;
        default:
          valA = a.updatedAt;
          valB = b.updatedAt;
      }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredListings(result);
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [listings, searchTerm, categoryFilter, siteFilter, sortField, sortOrder, siteSlug]);

  // Data fetching on component mount
  useEffect(() => {
    if (!initialListings) {
      fetchListings();
    }
    fetchCategories();
    fetchSites();
  }, [fetchListings, fetchCategories, fetchSites, initialListings]);

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentListings = filteredListings.slice(startIndex, endIndex);

  // Pagination controls
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    // Data
    listings,
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
  };
}
