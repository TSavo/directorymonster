import { Metadata } from 'next';
import { ListingTable } from '@/components/admin/listings';

export const metadata: Metadata = {
  title: 'Manage Listings - Admin Dashboard',
  description: 'View, edit, and manage all your directory listings',
};

/**
 * Admin Listings Management Page
 * 
 * This page displays all listings across all sites with the ability to filter by site.
 * It's the main hub for managing directory content.
 */
export default function AdminListingsPage() {
  return (
    <main>
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Manage Listings
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          View, edit, and manage all your directory listings
        </p>
      </div>
      
      <div className="border-t border-gray-200">
        <ListingTable />
      </div>
    </main>
  );
}
