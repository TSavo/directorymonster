"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface AdvancedSearchDialogProps {
  children?: React.ReactNode;
}

type SearchScope = 'all' | 'users' | 'roles' | 'sites' | 'listings' | 'content';

interface SearchFilter {
  key: string;
  value: string;
  label: string;
}

export function AdvancedSearchDialog({ children }: AdvancedSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    // Build search URL
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    searchParams.append('scope', scope);

    // Add filters
    filters.forEach(filter => {
      searchParams.append(filter.key, filter.value);
    });

    // Navigate to search results
    router.push(`/admin/search?${searchParams.toString()}`);
    setOpen(false);
  };

  const addFilter = (key: string, value: string, label: string) => {
    setFilters(prev => [...prev, { key, value, label }]);
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const clearFilters = () => {
    setFilters([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced Search</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Advanced Search</DialogTitle>
          <DialogDescription>
            Search across the system with advanced filtering options.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="space-y-4 mt-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={!query.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Search Scope</Label>
              <RadioGroup
                value={scope}
                onValueChange={(value) => setScope(value as SearchScope)}
                className="flex flex-wrap gap-2 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="scope-all" />
                  <Label htmlFor="scope-all">All</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="users" id="scope-users" />
                  <Label htmlFor="scope-users">Users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="roles" id="scope-roles" />
                  <Label htmlFor="scope-roles">Roles</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sites" id="scope-sites" />
                  <Label htmlFor="scope-sites">Sites</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="listings" id="scope-listings" />
                  <Label htmlFor="scope-listings">Listings</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="content" id="scope-content" />
                  <Label htmlFor="scope-content">Content</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1"
                >
                  <Filter className="h-4 w-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>

                {filters.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {filters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.map((filter, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {filter.label}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilter(index)}
                        className="h-4 w-4 p-0 ml-1"
                        data-testid="remove-filter"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {showFilters && (
                <div className="space-y-4 mt-4 p-4 border rounded-md bg-muted/20">
                  {scope === 'all' || scope === 'users' ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">User Filters</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          onValueChange={(value) =>
                            addFilter('userStatus', value, `Status: ${value}`)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={(value) =>
                            addFilter('userRole', value, `Role: ${value}`)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : null}

                  {scope === 'all' || scope === 'roles' ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Role Filters</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          onValueChange={(value) =>
                            addFilter('roleType', value, `Type: ${value}`)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={(value) =>
                            addFilter('roleScope', value, `Scope: ${value}`)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Scope" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tenant">Tenant</SelectItem>
                            <SelectItem value="site">Site</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : null}

                  {scope === 'all' || scope === 'listings' || scope === 'content' ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Content Filters</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          onValueChange={(value) =>
                            addFilter('contentStatus', value, `Status: ${value}`)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={(value) =>
                            addFilter('contentCategory', value, `Category: ${value}`)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="news">News</SelectItem>
                            <SelectItem value="events">Events</SelectItem>
                            <SelectItem value="products">Products</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="featured"
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addFilter('featured', 'true', 'Featured');
                            }
                          }}
                        />
                        <Label htmlFor="featured">Featured Content Only</Label>
                      </div>
                    </div>
                  ) : null}

                  {scope === 'all' || scope === 'sites' ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Site Filters</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          onValueChange={(value) =>
                            addFilter('siteStatus', value, `Status: ${value}`)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
