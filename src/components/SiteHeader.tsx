import Image from 'next/image';
import Link from 'next/link';
import { SiteConfig } from '@/types';

interface SiteHeaderProps {
  site: SiteConfig;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export default function SiteHeader({ site, categories }: SiteHeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3">
            {site.logoUrl && (
              <div className="relative h-10 w-10">
                <Image
                  src={site.logoUrl}
                  alt={site.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <Link href="/" className="text-2xl font-bold">
              {site.name}
            </Link>
          </div>
          
          {/* SEO-optimized H1 for homepage */}
          <h1 className="sr-only">{site.headerText}</h1>
        </div>
        
        {/* Navigation */}
        <nav className="mt-4">
          <ul className="flex flex-wrap gap-6">
            <li>
              <Link href="/" className="hover:text-blue-600 hover:underline">
                Home
              </Link>
            </li>
            {categories.map(category => (
              <li key={category.id}>
                <Link 
                  href={`/${category.slug}`} 
                  className="hover:text-blue-600 hover:underline"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}