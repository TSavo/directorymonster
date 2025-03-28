import Link from 'next/link';
import { kv } from '@/lib/redis-client';
import { SiteConfig } from '@/types';

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
  const hostname = debugHostname || headerHost || 'localhost:3000';
  
  // Get sites for display
  const siteKeys = await kv.keys('site:slug:*');
  const sites = await Promise.all(
    siteKeys.map(async (key) => await kv.get<SiteConfig>(key))
  );
  
  // Get site by domain
  let currentSite = null;
  if (debugHostname) {
    const domainKey = `site:domain:${debugHostname}`;
    const siteId = await kv.get(domainKey);
    
    if (siteId) {
      currentSite = await kv.get(`site:${siteId}`);
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">DirectoryMonster</h1>
        
        {currentSite && (
          <div className="mb-8 mt-8">
            <h2 className="text-xl font-semibold mb-4">Current Site:</h2>
            <div className="bg-blue-50 p-6 rounded border border-blue-100">
              <h3 className="text-2xl font-bold mb-2">{currentSite.name}</h3>
              <p className="mb-4 text-gray-600">{currentSite.metaDescription}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Domain:</p>
                  <p className="font-medium">{currentSite.domain}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Slug:</p>
                  <p className="font-medium">{currentSite.slug}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-8 mt-8">
          <h2 className="text-xl font-semibold mb-4">Available Sites:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sites.length > 0 ? (
              sites.map((site) => (
                <div key={site.id} className="border rounded p-4 hover:bg-gray-50">
                  <h3 className="text-lg font-medium mb-2">{site.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{site.metaDescription?.substring(0, 100)}...</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Domain: <span className="font-medium">{site.domain}</span></span>
                    <Link 
                      href={`/?hostname=${site.domain}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Site
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-4 text-center border rounded bg-gray-50">
                <p className="text-gray-500">No sites found. Try seeding data first.</p>
                <p className="mt-2 text-sm text-gray-400">Run: <code className="bg-gray-100 p-1 rounded">npm run seed</code></p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-8 border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">API Status:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <h3 className="text-lg font-medium mb-2">API Endpoints</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/api/healthcheck"
                    className="text-blue-600 hover:text-blue-800"
                    target="_blank"
                  >
                    /api/healthcheck
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/api/sites"
                    className="text-blue-600 hover:text-blue-800"
                    target="_blank"
                  >
                    /api/sites
                  </Link>
                </li>
                {sites[0] && (
                  <>
                    <li>
                      <Link 
                        href={`/api/sites/${sites[0].slug}/categories`}
                        className="text-blue-600 hover:text-blue-800"
                        target="_blank"
                      >
                        /api/sites/{sites[0].slug}/categories
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href={`/api/sites/${sites[0].slug}/listings`}
                        className="text-blue-600 hover:text-blue-800"
                        target="_blank"
                      >
                        /api/sites/{sites[0].slug}/listings
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div className="border rounded p-4">
              <h3 className="text-lg font-medium mb-2">Admin</h3>
              <div className="mt-4">
                <Link 
                  href="/admin" 
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <footer className="border-t pt-6 mt-8 text-center text-sm text-gray-500">
          <p>DirectoryMonster - An SEO-Focused Multitenancy Directory Platform</p>
          <p className="mt-1">Current hostname: {hostname}</p>
        </footer>
      </div>
    </div>
  );
}