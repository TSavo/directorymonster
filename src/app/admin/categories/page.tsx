import React from 'react';
import { CategoryTable } from '@/components/admin/categories';

export default function AdminCategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Category Management</h1>
      <CategoryTable />
    </div>
  );
}
