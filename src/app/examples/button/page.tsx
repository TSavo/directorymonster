'use client';

import React from 'react';
import ButtonShowcase from '@/components/ui/examples/ButtonShowcase';

export default function ButtonShowcasePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Button Component Showcase</h1>
      <p className="text-gray-600 mb-8">
        This page showcases all the variants, sizes, and features of the Button component.
        Use this as a reference when implementing buttons in your components.
      </p>
      <div className="bg-white rounded-lg shadow-md">
        <ButtonShowcase />
      </div>
    </div>
  );
}
