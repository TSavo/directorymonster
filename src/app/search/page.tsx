import { Metadata } from 'next';
import { SearchForm, SearchResults } from '@/components/search';
import { getSiteFromRequest } from '@/lib/site-utils';
import { kv } from '@/lib/redis-client';
import { Category, SiteConfig } from '@/types';
import { categoryKeys } from '@/lib/tenant';
import { currentUser } from '@/lib/auth';

interface SearchPageProps {
  searchParams: {
    q?: string;
    siteId?: string;
  };
}

export async function generateMetadata(
  { searchParams }: SearchPageProps
): Promise<Metadata> {
  const { q } = searchParams;
  
  return {
    title: q ? `Search Results for "${q}"` : 'Search',
    description: q 
      ? `Search results for "${q}" in our directory`
      : 'Search our directory for products, services, and information',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, siteId } = searchParams;
  
  // Get the current site from the request
  const site = await getSiteFromRequest();
  
  // If siteId is provided, use that instead
  let activeSite = site;
  if (siteId) {
    const siteById = await kv.get<SiteConfig>(`site:id:${siteId}`);
    if (siteById) {
      activeSite = siteById;
    }
  }
  
  // Get all categories for this site
  const allCategoriesKeys = await kv.keys(categoryKeys.allForSite(activeSite.id));
  const categories: Category[] = [];
  
  if (allCategoriesKeys.length > 0) {
    const categoryPromises = allCategoriesKeys.map(key => kv.get<Category>(key));
    const categoryResults = await Promise.all(categoryPromises);
    
    categoryResults.forEach(category => {
      if (category) {
        categories.push(category);
      }
    });
    
    // Sort categories by name
    categories.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Check if user is admin
  const user = await currentUser();
  const isAdmin = user && (
    user.isAdmin || 
    (user.adminSites && user.adminSites.includes(activeSite.id))
  );
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Search form */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Search</h1>
          <SearchForm 
            siteId={activeSite.id}
            placeholder="Search for products, services, or keywords..."
            className="max-w-2xl"
          />
        </div>
        
        {/* Search results */}
        {q ? (
          <SearchResults 
            query={q} 
            siteId={activeSite.id}
            site={activeSite}
            categories={categories}
            isAdmin={isAdmin}
          />
        ) : (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <p className="text-lg text-gray-600">Enter a search query to find listings</p>
            <p className="text-gray-500 mt-2">Try searching for keywords related to products or services</p>
          </div>
        )}
      </div>
    </main>
  );
}