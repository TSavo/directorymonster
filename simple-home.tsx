import Link from 'next/link';
import { getSiteByHostname } from '@/lib/site-utils';
import { kv } from '@/lib/redis-client';

// Function to get hostname from request headers in server component
async function getHostname() {
  const { headers } = await import('next/headers');
  const headersList = headers();
  const hostHeader = headersList.get('host') || '';
  return hostHeader;
}

export default async function Home({ searchParams }) {
  // Get hostname
  const headerHost = await getHostname();
  const debugHostname = searchParams?.hostname as string | undefined;
  const hostname = debugHostname || headerHost || 'localhost:3001';
  
  // Get site
  const site = await getSiteByHostname(hostname);
  
  // Get sites for fallback
  const siteKeys = await kv.keys('site:slug:*');
  const sites = await Promise.all(
    siteKeys.map(async (key) => await kv.get(key))
  );
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6">DirectoryMonster</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Site:</h2>
          {site ? (
            <div className="bg-blue-50 p-4 rounded">
              <p><strong>Name:</strong> {site.name}</p>
              <p><strong>Slug:</strong> {site.slug}</p>
              <p><strong>Domain:</strong> {site.domain}</p>
            </div>
          ) : (
            <p className="text-red-500">No site found for hostname: {hostname}</p>
          )}
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Available Sites:</h2>
          <ul className="list-disc pl-5 space-y-2">
            {sites.length > 0 ? (
              sites.map((site) => (
                <li key={site.id}>
                  <strong>{site.name}</strong> ({site.domain})
                </li>
              ))
            ) : (
              <li className="text-red-500">No sites found in database</li>
            )}
          </ul>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link 
            href="/admin" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}