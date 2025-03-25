import Link from 'next/link';
import { Listing, Category } from '@/types';
import { generateListingHref, generateCategoryHref } from '@/lib/site-utils';
import { ReactNode } from 'react';

interface CategoryLinkProps {
  category: Category | { slug: string };
  className?: string;
  children: ReactNode;
  // Allow any additional props
  [key: string]: any;
}

export function CategoryLink({ category, className, children, ...props }: CategoryLinkProps) {
  return (
    <Link 
      href={generateCategoryHref(category.slug)}
      className={className}
      {...props}
    >
      {children}
    </Link>
  );
}

interface ListingLinkProps {
  listing: Listing;
  className?: string;
  children: ReactNode;
  // Allow any additional props
  [key: string]: any;
}

export function ListingLink({ listing, className, children, ...props }: ListingLinkProps) {
  return (
    <Link 
      href={generateListingHref(listing.categorySlug || listing.categoryId, listing.slug)}
      className={className}
      {...props}
    >
      {children}
    </Link>
  );
}

interface ListingLinkWithCategoryProps {
  categorySlug: string;
  listingSlug: string;
  className?: string;
  children: ReactNode;
  // Allow any additional props
  [key: string]: any;
}

export function ListingLinkWithCategory({ categorySlug, listingSlug, className, children, ...props }: ListingLinkWithCategoryProps) {
  return (
    <Link 
      href={generateListingHref(categorySlug, listingSlug)}
      className={className}
      {...props}
    >
      {children}
    </Link>
  );
}