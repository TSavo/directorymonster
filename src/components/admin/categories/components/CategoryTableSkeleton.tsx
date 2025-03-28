'use client';

export default function CategoryTableSkeleton() {
  return (
    <div className="w-full p-4" data-testid="category-table-skeleton">
      <div className="h-8 bg-gray-200 rounded animate-pulse mb-4 w-40"></div>
      
      <div className="h-10 bg-gray-200 rounded animate-pulse mb-4 w-full"></div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50">
          <div className="h-10 bg-gray-200 animate-pulse w-full"></div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 bg-gray-100 animate-pulse w-full" style={{ animationDelay: `${index * 0.1}s` }}></div>
          ))}
        </div>
      </div>
      
      <div role="status" className="sr-only" data-testid="loading-status">
        Loading categories data, please wait...
      </div>
      
      <div className="h-10 bg-gray-200 rounded animate-pulse mt-4 w-2/3 mx-auto"></div>
    </div>
  );
}
