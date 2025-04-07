import React from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AdvancedSearchDialog } from '@/components/ui/advanced-search';
import { Search, Filter, User, Shield, Globe, FileText, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Search Results | Admin Dashboard',
  description: 'Search results across the system',
};

interface SearchPageProps {
  searchParams: {
    q?: string;
    scope?: string;
    [key: string]: string | string[] | undefined;
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const scope = searchParams.scope || 'all';
  
  // Extract filters from searchParams
  const filters = Object.entries(searchParams)
    .filter(([key]) => key !== 'q' && key !== 'scope')
    .map(([key, value]) => ({ key, value: value as string }));
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Search Results</h1>
            <p className="text-muted-foreground">
              {query ? `Results for "${query}"` : 'Advanced Search'}
            </p>
          </div>
          <AdvancedSearchDialog>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Search className="h-4 w-4" />
              Modify Search
            </Button>
          </AdvancedSearchDialog>
        </div>
        
        {query ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Filters:</span>
                {filters.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {filters.map((filter, index) => (
                      <div key={index} className="flex items-center bg-muted text-xs px-2 py-1 rounded-full">
                        <span className="font-medium">{filter.key}:</span>
                        <span className="ml-1">{filter.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm">None</span>
                )}
              </div>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
            
            <Tabs defaultValue={scope} className="w-full">
              <TabsList className="grid grid-cols-5 w-full max-w-md">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Roles
                </TabsTrigger>
                <TabsTrigger value="sites" className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Sites
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Content
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6">
                <div className="space-y-8">
                  {/* Users section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Users
                      </h2>
                      <Button variant="link" size="sm">
                        View all user results
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Sample user results */}
                      <div className="border rounded-md p-4 hover:bg-muted/20 transition-colors">
                        <div className="font-medium">John Doe</div>
                        <div className="text-sm text-muted-foreground">john.doe@example.com</div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Active
                          </div>
                          <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Admin
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4 hover:bg-muted/20 transition-colors">
                        <div className="font-medium">Jane Smith</div>
                        <div className="text-sm text-muted-foreground">jane.smith@example.com</div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Active
                          </div>
                          <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            Editor
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Roles section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Roles
                      </h2>
                      <Button variant="link" size="sm">
                        View all role results
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Sample role results */}
                      <div className="border rounded-md p-4 hover:bg-muted/20 transition-colors">
                        <div className="font-medium">Content Manager</div>
                        <div className="text-sm text-muted-foreground">Manage content across all sites</div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Tenant
                          </div>
                          <div className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                            Custom
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="users" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">User Results</h2>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Sample user results */}
                    <div className="border rounded-md p-4 hover:bg-muted/20 transition-colors">
                      <div className="font-medium">John Doe</div>
                      <div className="text-sm text-muted-foreground">john.doe@example.com</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Active
                        </div>
                        <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Admin
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 hover:bg-muted/20 transition-colors">
                      <div className="font-medium">Jane Smith</div>
                      <div className="text-sm text-muted-foreground">jane.smith@example.com</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Active
                        </div>
                        <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                          Editor
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 hover:bg-muted/20 transition-colors">
                      <div className="font-medium">Bob Johnson</div>
                      <div className="text-sm text-muted-foreground">bob.johnson@example.com</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Pending
                        </div>
                        <div className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          Viewer
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Other tab contents would be similar */}
              <TabsContent value="roles" className="mt-6">
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Role search results would appear here.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="sites" className="mt-6">
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Site search results would appear here.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="mt-6">
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Content search results would appear here.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-medium mb-2">Start a new search</h2>
            <p className="text-muted-foreground mb-6">
              Use the search bar above to find users, roles, sites, and content.
            </p>
            <AdvancedSearchDialog>
              <Button className="flex items-center gap-1">
                <Search className="h-4 w-4" />
                Advanced Search
              </Button>
            </AdvancedSearchDialog>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
