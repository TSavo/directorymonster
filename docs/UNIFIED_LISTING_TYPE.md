# Unified Listing Type Documentation

## Overview

This document describes the unified Listing type definition used throughout the DirectoryMonster application. The Listing type is a core data structure that represents directory listings across the platform.

## Single Source of Truth

The Listing type is defined in `src/types/listing.ts` and serves as the single source of truth for all listing-related data structures. This unified approach ensures consistency across the codebase and simplifies maintenance.

## Type Definition

The core Listing interface includes the following properties:

```typescript
export interface Listing {
  id: string;
  siteId: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  status: ListingStatus | string;
  categoryIds: string[];
  categorySlug?: string;
  categories?: { id: string; name: string; slug: string; }[]; // Simplified Category type
  media: ListingMedia[];
  price?: ListingPrice;
  contactInfo?: ContactInfo;
  seoData?: SEOData;
  backlinkInfo?: BacklinkInfo;
  customFields?: CustomField[] | Record<string, unknown>;
  featured?: boolean;
  featuredUntil?: string;
  viewCount?: number;
  clickCount?: number;
  submissionId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
  userId: string;
  userDisplayName?: string;
}
```

## Related Types

The Listing type is accompanied by several related types and enums:

### ListingStatus

```typescript
export enum ListingStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected'
}
```

### MediaType

```typescript
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio'
}
```

### PriceType

```typescript
export enum PriceType {
  FIXED = 'fixed',
  RANGE = 'range',
  STARTING_AT = 'starting_at',
  CONTACT = 'contact',
  FREE = 'free'
}
```

## Usage Guidelines

### Importing the Listing Type

Components should import the Listing type directly from the source:

```typescript
import { Listing, ListingStatus } from '@/types/listing';
```

Or via the re-export in `@/types`:

```typescript
import { Listing, ListingStatus } from '@/types';
```

### Component-Specific Types

Components should not extend or redefine the Listing type. Instead, they should:

1. Use the unified type directly
2. Create component-specific types that reference the unified type
3. Define component state interfaces separately

Example:

```typescript
import { Listing } from '@/types/listing';

// Component-specific state
interface ListingFormState {
  listing: Listing;
  isSubmitting: boolean;
  errors: Record<string, string>;
}
```

## Relationship to Submissions

The Submission type is designed to transform into a Listing after approval:

```typescript
import { Listing } from '@/types/listing';

export interface Submission {
  // Submission-specific properties
  id: string;
  status: SubmissionStatus;
  // ...other properties
  
  // Data that will become a listing
  listingData: Partial<Listing>;
  
  // Transform method
  transformToListing(): Listing;
}
```

## Benefits of Unified Type

1. **Consistency**: All components work with the same data structure
2. **Maintainability**: Changes to the type only need to be made in one place
3. **Type Safety**: Proper typing throughout the application
4. **Documentation**: Single source of truth for what constitutes a listing
5. **Integration**: Easier integration with APIs and services

## Future Considerations

As the application evolves, the Listing type may need to be extended. When making changes:

1. Update the unified type in `src/types/listing.ts`
2. Add proper JSDoc comments for new properties
3. Update tests to reflect the changes
4. Consider backward compatibility
