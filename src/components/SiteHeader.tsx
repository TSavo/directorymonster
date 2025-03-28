import Image from 'next/image';
import Link from 'next/link';
import { SiteConfig } from '@/types';
import { CategoryLink } from './LinkUtilities';
import { SearchBar } from './search';

interface SiteHeaderProps {
  site: SiteConfig;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export default function SiteHeader({ site, categories }: SiteHeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
          <div className="flex items-center">
            {site.logoUrl && (
              <div className="relative h-10 w-10 mr-3">
                <Image
                  src={site.logoUrl}
                  alt={site.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              {site.name}
            </Link>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4 sm:mt-0">
            <SearchBar siteId={site.id} />
          </div>
          
          {/* SEO-optimized H1 for homepage */}
          <h1 className="sr-only">{site.headerText}</h1>
        </div>
        
        {/* Navigation */}
        <nav className="py-4 border-t border-gray-100">
          <ul className="flex flex-wrap gap-8">
            <li>
              <Link 
                href="/" 
                className="text-base font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Home
              </Link>
            </li>
            {categories.map(category => (
              <li key={category.id}>
                <CategoryLink 
                  category={category}
                  className="text-base font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {category.name}
                </CategoryLink>
              </li>
            ))}
            <li>
              <Link 
                href="/search" 
                className="text-base font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Advanced Search
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}