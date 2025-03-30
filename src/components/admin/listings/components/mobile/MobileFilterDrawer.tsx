import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FilterIcon, XIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Category, ListingStatus } from '@/components/admin/listings/types';
import { Badge } from '@/components/ui/badge';

interface MobileFilterDrawerProps {
  categories: Category[];
  activeFilters: {
    status?: ListingStatus[];
    categoryIds?: string[];
    priceMin?: number;
    priceMax?: number;
  };
  onFilterChange: (filters: any) => void;
}

const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  categories,
  activeFilters,
  onFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(activeFilters);
  
  const statusOptions: ListingStatus[] = ['active', 'draft', 'archived'];
  
  const handleClose = () => {
    setIsOpen(false);
  };
  
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    handleClose();
  };
  
  const handleReset = () => {
    const resetFilters = {
      status: undefined,
      categoryIds: undefined,
      priceMin: undefined,
      priceMax: undefined,
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    handleClose();
  };
  
  const handleStatusChange = (status: ListingStatus) => {
    setLocalFilters(prev => {
      const currentStatus = prev.status || [];
      
      if (currentStatus.includes(status)) {
        return {
          ...prev,
          status: currentStatus.filter(s => s !== status),
        };
      } else {
        return {
          ...prev,
          status: [...currentStatus, status],
        };
      }
    });
  };
  
  const handleCategoryChange = (categoryId: string) => {
    setLocalFilters(prev => {
      const currentCategoryIds = prev.categoryIds || [];
      
      if (currentCategoryIds.includes(categoryId)) {
        return {
          ...prev,
          categoryIds: currentCategoryIds.filter(id => id !== categoryId),
        };
      } else {
        return {
          ...prev,
          categoryIds: [...currentCategoryIds, categoryId],
        };
      }
    });
  };
  
  const handlePriceChange = (field: 'priceMin' | 'priceMax', value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    
    setLocalFilters(prev => ({
      ...prev,
      [field]: numValue,
    }));
  };
  
  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.status?.length) count += localFilters.status.length;
    if (localFilters.categoryIds?.length) count += localFilters.categoryIds.length;
    if (localFilters.priceMin !== undefined) count += 1;
    if (localFilters.priceMax !== undefined) count += 1;
    return count;
  };
  
  const activeFilterCount = getActiveFilterCount();

  return (
    <div data-testid="mobile-filter-drawer">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full md:hidden flex items-center justify-between"
          >
            <div className="flex items-center">
              <FilterIcon className="mr-2 h-4 w-4" />
              <span>Filters</span>
            </div>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        
        <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>Filters</SheetTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClose} 
                className="h-8 w-8 p-0"
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </SheetHeader>
          
          <div className="overflow-y-auto h-[calc(100vh-8rem)]">
            <Accordion type="multiple" defaultValue={['status', 'category', 'price']} className="px-4">
              {/* Status Filter */}
              <AccordionItem value="status">
                <AccordionTrigger>Status</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {statusOptions.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`status-${status}`}
                          checked={localFilters.status?.includes(status) || false}
                          onCheckedChange={() => handleStatusChange(status)}
                        />
                        <Label 
                          htmlFor={`status-${status}`}
                          className="text-sm font-normal capitalize cursor-pointer"
                        >
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Category Filter */}
              <AccordionItem value="category">
                <AccordionTrigger>Categories</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`category-${category.id}`}
                          checked={localFilters.categoryIds?.includes(category.id) || false}
                          onCheckedChange={() => handleCategoryChange(category.id)}
                        />
                        <Label 
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Price Filter */}
              <AccordionItem value="price">
                <AccordionTrigger>Price Range</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price-min" className="text-sm">
                        Min Price
                      </Label>
                      <input
                        id="price-min"
                        type="number"
                        min="0"
                        className="w-full p-2 text-sm border rounded-md"
                        value={localFilters.priceMin || ''}
                        onChange={(e) => handlePriceChange('priceMin', e.target.value)}
                        placeholder="Min"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price-max" className="text-sm">
                        Max Price
                      </Label>
                      <input
                        id="price-max"
                        type="number"
                        min="0"
                        className="w-full p-2 text-sm border rounded-md"
                        value={localFilters.priceMax || ''}
                        onChange={(e) => handlePriceChange('priceMax', e.target.value)}
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          <SheetFooter className="p-4 border-t flex flex-row justify-between">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="w-1/2 mr-2"
            >
              Reset
            </Button>
            <Button 
              onClick={handleApplyFilters}
              className="w-1/2"
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileFilterDrawer;