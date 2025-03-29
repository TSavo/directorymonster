/**
 * Component Tests Index
 * 
 * This file serves as a centralized entry point for organizing component tests.
 * It doesn't contain actual tests but loads all component test modules.
 */

// Core Components
import '../Button.test';
import '../ListingCard.test';
import '../SiteHeader.test';
import '../LinkUtilities.test';
import '../SideNav.test';

// Admin Components
// - Dashboard Components
import '../admin/dashboard/ActivityFeed.test';
import '../admin/dashboard/StatisticCards.test'; 

// - Authentication Components
import '../admin/auth/ZKPLogin.test';

// - Layout Components 
import '../admin/layout/AdminSidebar.test';
import '../admin/layout/AdminHeader.test';
import '../admin/layout/Breadcrumbs.test';

// - Category Components
import '../admin/categories/CategoryTable.test';
import '../admin/categories/components/CategoryTableRow.test';
import '../admin/categories/components/CategoryTableHeader.test';
import '../admin/categories/components/CategoryTablePagination.test';
import '../admin/categories/components/CategoryTableSkeleton.test';
import '../admin/categories/components/CategoryTableEmptyState.test';
import '../admin/categories/components/DeleteConfirmationModal.test';

// - Listing Components
import '../admin/listings/ListingTable.test';
import '../admin/listings/components/ListingTableRow.test';
import '../admin/listings/components/ListingTableHeader.test';

// - Site Components
import '../admin/sites/SiteForm.test';
import '../admin/sites/SiteSettings.test';
import '../admin/sites/DomainManager.test';
import '../admin/sites/components/SEOSettings.test';
import '../admin/sites/components/SEOSettings.validation.test';
import '../admin/sites/components/SEOSettings.noindex.test';
import '../admin/sites/components/SEOSettings.api.test';

// Search Components
import '../search/SearchForm.test';
import '../search/SearchResults.test';
