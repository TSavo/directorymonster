import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

// Example icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const ButtonShowcase = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="outline-primary">Outline Primary</Button>
          <Button variant="outline-danger">Outline Danger</Button>
          <Button variant="outline-success">Outline Success</Button>
          <Button variant="outline-warning">Outline Warning</Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Button Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><SearchIcon /></Button>
          <div className="w-full mt-2">
            <Button size="full">Full Width</Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Loading State</h2>
        <div className="flex flex-wrap gap-4">
          <Button isLoading>Loading</Button>
          <Button isLoading={isLoading} onClick={handleLoadingClick}>
            {isLoading ? 'Loading...' : 'Click to Load'}
          </Button>
          <Button isLoading={isLoading} loadingText="Processing..." onClick={handleLoadingClick}>
            Submit
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">With Icons</h2>
        <div className="flex flex-wrap gap-4">
          <Button leftIcon={<SearchIcon />}>
            Search
          </Button>
          <Button rightIcon={<ArrowRightIcon />}>
            Next
          </Button>
          <Button leftIcon={<CheckIcon />} rightIcon={<ArrowRightIcon />}>
            Complete and Continue
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Composition with Next.js Link</h2>
        <div className="flex flex-wrap gap-4">
          <Button asChild variant="primary">
            <Link href="#">Primary Link</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="#">Secondary Link</Link>
          </Button>
          <Button asChild variant="link">
            <Link href="#">Link Style</Link>
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Disabled State</h2>
        <div className="flex flex-wrap gap-4">
          <Button disabled>Disabled Primary</Button>
          <Button variant="secondary" disabled>Disabled Secondary</Button>
          <Button variant="danger" disabled>Disabled Danger</Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Common Patterns</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Form Actions</h3>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary">
              Cancel
            </Button>
            <Button variant="primary">
              Submit
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Table Actions</h3>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="View item"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit item"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete item"
              className="text-red-600 hover:text-red-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Filter Actions</h3>
          <div className="flex justify-between border-t pt-4">
            <Button
              variant="link"
              size="sm"
            >
              Clear Filters
            </Button>
            <Button
              variant="primary"
              size="sm"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonShowcase;
