import React from 'react';
import Link from 'next/link';

export default function NewCategoryPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create New Category</h1>
        <Link
          href="/admin/categories"
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
      
      {/* This is just a placeholder - in a real implementation, we would use a CategoryForm component */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 border border-gray-200">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Category Name</label>
            <div className="mt-1">
              <input
                type="text"
                name="name"
                id="name"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter category name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
            <div className="mt-1">
              <input
                type="text"
                name="slug"
                id="slug"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="enter-category-slug"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">The URL-friendly version of the name. All lowercase, no spaces.</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <div className="mt-1">
              <textarea
                id="description"
                name="description"
                rows={3}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter category description"
              ></textarea>
            </div>
          </div>

          <div>
            <label htmlFor="parent" className="block text-sm font-medium text-gray-700">Parent Category</label>
            <div className="mt-1">
              <select
                id="parent"
                name="parent"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">None (Top Level)</option>
                <option value="1">Camping</option>
                <option value="2">Fishing</option>
                <option value="3">Hiking</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Category
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
