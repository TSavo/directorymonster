import React, { useCallback } from 'react';
import { DropdownMenu, DropdownMenuItem } from '../../../../ui/dropdown-menu';
import { Button } from '../../../../ui/button';
import { Badge } from '../../../../ui/badge';
import { useSites } from '../../sites/hooks/useSites';

interface SiteFilterDropdownProps {
  onSelectSite?: (siteId: string | null) => void;
  selectedSiteId?: string | null;
  className?: string;
}

export const SiteFilterDropdown: React.FC<SiteFilterDropdownProps> = ({
  onSelectSite,
  selectedSiteId,
  className = '',
}) => {
  const { sites, isLoading } = useSites();

  const handleSelectSite = useCallback((siteId: string | null) => {
    onSelectSite?.(siteId);
  }, [onSelectSite]);

  if (isLoading) {
    return <div>Loading sites...</div>;
  }

  const selectedSite = sites.find(site => site.id === selectedSiteId);

  return (
    <div className={`site-filter-dropdown ${className}`} data-testid="site-filter-dropdown">
      {selectedSiteId && (
        <div className="active-filter-badge mb-2">
          <Badge 
            variant="primary" 
            className="flex items-center gap-1"
            data-testid="active-site-filter"
          >
            {selectedSite?.name || 'Unknown site'}
            <button 
              className="ml-1 text-xs"
              onClick={() => handleSelectSite(null)}
              data-testid="clear-site-filter"
            >
              ×
            </button>
          </Badge>
        </div>
      )}
      
      <DropdownMenu
        trigger={
          <Button variant="outline" size="sm" data-testid="site-filter-dropdown-button">
            {selectedSiteId ? 'Change Site' : 'Filter by Site'}
          </Button>
        }
        align="left"
      >
        {sites.map(site => (
          <DropdownMenuItem
            key={site.id}
            onClick={() => handleSelectSite(site.id)}
            className={selectedSiteId === site.id ? 'active' : ''}
          >
            {site.name}
          </DropdownMenuItem>
        ))}
        {selectedSiteId && (
          <DropdownMenuItem onClick={() => handleSelectSite(null)}>
            Clear selection
          </DropdownMenuItem>
        )}
      </DropdownMenu>
    </div>
  );
};

export default SiteFilterDropdown;