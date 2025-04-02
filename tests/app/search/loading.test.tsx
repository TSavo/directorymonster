/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SearchLoading from '@/app/search/loading';
import '@testing-library/jest-dom';

describe('SearchLoading Component', () => {
  it('renders search form skeleton', () => {
    render(<SearchLoading />);
    
    // Check for form title skeleton
    const formTitleSkeleton = document.querySelector('.h-10.w-40.bg-gray-200.rounded.animate-pulse');
    expect(formTitleSkeleton).toBeInTheDocument();
    
    // Check for form input and button skeletons
    const formInputSkeleton = document.querySelector('.flex-grow.h-10.bg-gray-200.rounded.animate-pulse');
    const formButtonSkeleton = document.querySelector('.w-24.h-10.bg-gray-200.rounded.animate-pulse');
    
    expect(formInputSkeleton).toBeInTheDocument();
    expect(formButtonSkeleton).toBeInTheDocument();
  });

  it('renders search results skeleton', () => {
    render(<SearchLoading />);
    
    // Check for results header skeleton
    const resultsHeaderSkeleton = document.querySelector('.h-8.w-64.bg-gray-200.rounded.animate-pulse');
    expect(resultsHeaderSkeleton).toBeInTheDocument();
    
    // Check for results count skeleton
    const resultsCountSkeleton = document.querySelector('.h-5.w-32.bg-gray-200.rounded.animate-pulse');
    expect(resultsCountSkeleton).toBeInTheDocument();
  });

  it('renders listing card skeletons', () => {
    render(<SearchLoading />);
    
    // Should have 5 listing card skeletons
    const listingCardSkeletons = document.querySelectorAll('.border.rounded-lg.p-4');
    expect(listingCardSkeletons.length).toBe(5);
    
    // Each card should have image and content skeletons
    const firstCard = listingCardSkeletons[0];
    
    // Image skeleton
    const imageSkeleton = firstCard.querySelector('.md\\:w-1\\/4.h-40.bg-gray-200.rounded.animate-pulse');
    expect(imageSkeleton).toBeInTheDocument();
    
    // Title skeleton
    const titleSkeleton = firstCard.querySelector('.h-7.w-3\\/4.bg-gray-200.rounded.animate-pulse');
    expect(titleSkeleton).toBeInTheDocument();
    
    // Description skeletons
    const descriptionSkeletons = firstCard.querySelectorAll('.h-4.bg-gray-200.rounded.animate-pulse');
    expect(descriptionSkeletons.length).toBeGreaterThan(0);
  });

  it('applies responsive design classes', () => {
    render(<SearchLoading />);
    
    // Main container should exist
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toHaveClass('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8');
    
    // Cards should have responsive layout classes
    const cardContainer = document.querySelector('.flex.flex-col.md\\:flex-row.gap-4');
    expect(cardContainer).toBeInTheDocument();
    
    // Image container should have responsive width
    const imageContainer = document.querySelector('.w-full.md\\:w-1\\/4');
    expect(imageContainer).toBeInTheDocument();
    
    // Content container should have responsive width
    const contentContainer = document.querySelector('.w-full.md\\:w-3\\/4');
    expect(contentContainer).toBeInTheDocument();
  });
});
