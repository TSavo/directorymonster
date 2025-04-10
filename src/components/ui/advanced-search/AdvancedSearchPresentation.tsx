'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SearchScope, SearchFilter } from './hooks/useAdvancedSearch';

export interface AdvancedSearchPresentationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  scope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
  filters: SearchFilter[];
  showFilters: boolean;
  onShowFiltersChange: (show: boolean) => void;
  onSearch: (e: React.FormEvent) => void;
  onAddFilter: (key: string, value: string, label: string) => void;
  onRemoveFilter: (index: number) => void;
  onClearFilters: () => void;
  children?: React.ReactNode;
  dialogClassName?: string;
  triggerButtonVariant?: 'default' | 'outline' | 'ghost' | 'link';
  triggerButtonSize?: 'default' | 'sm' | 'lg';
  triggerButtonClassName?: string;
}

/**
 * Presentation component for advanced search dialog
 */
export function AdvancedSearchPresentation({
  open,
  onOpenChange,
  query,
  onQueryChange,
  scope,
  onScopeChange,
  filters,
  showFilters,
  onShowFiltersChange,
  onSearch,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  children,
  dialogClassName = 'sm:max-w-[600px]',
  triggerButtonVariant = 'outline',
  triggerButtonSize = 'sm',
  triggerButtonClassName = 'flex items-center gap-1'
}: AdvancedSearchPresentationProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant={triggerButtonVariant} 
            size={triggerButtonSize} 
            className={triggerButtonClassName}
            data-testid="advanced-search-trigger"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced Search</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={dialogClassName} data-testid="advanced-search-dialog">
        <DialogHeader>
          <DialogTitle>Advanced Search</DialogTitle>
          <DialogDescription>
            Search across the system with advanced filtering options.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSearch} className="space-y-4 mt-4" data-testid="advanced-search-form">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search..."
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="w-full"
                autoFocus
                data-testid="search-query-input"
              />
            </div>
            <Button type="submit" disabled={!query.trim()} data-testid="search-submit-button">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Search Scope</Label>
              <RadioGroup
                value={scope}
                onValueChange={(value) => onScopeChange(value as SearchScope)}
                className="flex flex-wrap gap-2 mt-2"
                data-testid="search-scope-group"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="scope-all" data-testid="scope-all" />
                  <Label htmlFor="scope-all">All</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="users" id="scope-users" data-testid="scope-users" />
                  <Label htmlFor="scope-users">Users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="roles" id="scope-roles" data-testid="scope-roles" />
                  <Label htmlFor="scope-roles">Roles</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sites" id="scope-sites" data-testid="scope-sites" />
                  <Label htmlFor="scope-sites">Sites</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="listings" id="scope-listings" data-testid="scope-listings" />
                  <Label htmlFor="scope-listings">Listings</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="content" id="scope-content" data-testid="scope-content" />
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
                  onClick={() => onShowFiltersChange(!showFilters)}
                  className="flex items-center gap-1"
                  data-testid="toggle-filters-button"
                >
                  <Filter className="h-4 w-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>

                {filters.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-muted-foreground"
                    data-testid="clear-filters-button"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {filters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2" data-testid="active-filters">
                  {filters.map((filter, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {filter.label}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveFilter(index)}
                        className="h-4 w-4 p-0 ml-1"
                        data-testid={`remove-filter-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {showFilters && (
                <div className="space-y-4 mt-4 p-4 border rounded-md bg-muted/20" data-testid="filters-panel">
                  {scope === 'all' || scope === 'users' ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">User Filters</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          onValueChange={(value) =>
                            onAddFilter('userStatus', value, `Status: ${value}`)
                          }
                          data-testid="user-status-select"
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
                            onAddFilter('userRole', value, `Role: ${value}`)
                          }
                          data-testid="user-role-select"
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
                            onAddFilter('roleType', value, `Type: ${value}`)
                          }
                          data-testid="role-type-select"
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
                            onAddFilter('roleScope', value, `Scope: ${value}`)
                          }
                          data-testid="role-scope-select"
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
                            onAddFilter('contentStatus', value, `Status: ${value}`)
                          }
                          data-testid="content-status-select"
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
                            onAddFilter('contentCategory', value, `Category: ${value}`)
                          }
                          data-testid="content-category-select"
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
                              onAddFilter('featured', 'true', 'Featured');
                            }
                          }}
                          data-testid="featured-checkbox"
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
                            onAddFilter('siteStatus', value, `Status: ${value}`)
                          }
                          data-testid="site-status-select"
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
