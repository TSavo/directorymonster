export default function SearchLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Search form skeleton */}
        <div className="mb-8">
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="max-w-2xl flex flex-col sm:flex-row gap-2">
            <div className="flex-grow h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Results skeleton */}
        <div className="border-b pb-4 mb-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Listing card skeletons */}
        <div className="space-y-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/4 h-40 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-full md:w-3/4 space-y-4">
                  <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}