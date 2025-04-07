import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { SiteConfig } from '@/types';
import { CategoryLink } from './LinkUtilities';
import { SearchBar } from './search';
import { Menu, X } from 'lucide-react';

interface SiteHeaderProps {
  site: SiteConfig;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export default function SiteHeader({ site, categories }: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white shadow-sm'}`}
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 md:py-6">
          {/* Logo and site name */}
          <div className="flex items-center">
            {site.logoUrl && (
              <div className="relative h-10 w-10 mr-3 overflow-hidden rounded-md">
                <Image
                  src={site.logoUrl}
                  alt={site.name}
                  fill
                  className="object-contain hover:scale-105 transition-transform duration-300"
                  data-testid="site-logo"
                  priority
                />
              </div>
            )}
            <Link
              href="/"
              className="text-2xl font-bold text-gradient hover:opacity-90 transition-opacity"
              aria-label={`${site.name} - Home`}
            >
              {site.name}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block" data-testid="site-navigation">
            <ul className="flex items-center space-x-8">
              <li>
                <Link
                  href="/"
                  className="text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
                >
                  Home
                </Link>
              </li>
              {categories.map(category => (
                <li key={category.id}>
                  <CategoryLink
                    category={category}
                    className="text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
                  >
                    {category.name}
                  </CategoryLink>
                </li>
              ))}
              <li>
                <Link
                  href="/search"
                  className="text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
                >
                  Advanced Search
                </Link>
              </li>
            </ul>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:block">
            <SearchBar siteId={site.id} />
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-neutral-700 hover:text-primary-600 hover:bg-neutral-100 transition-colors focus-visible"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* SEO-optimized H1 for homepage */}
          <h1 className="sr-only">{site.headerText}</h1>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <nav className="py-4 border-t border-neutral-200">
            <ul className="flex flex-col space-y-4">
              <li>
                <Link
                  href="/"
                  className="block text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              {categories.map(category => (
                <li key={category.id}>
                  <CategoryLink
                    category={category}
                    className="block text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.name}
                  </CategoryLink>
                </li>
              ))}
              <li>
                <Link
                  href="/search"
                  className="block text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Advanced Search
                </Link>
              </li>
              <li className="pt-2">
                <SearchBar siteId={site.id} />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}