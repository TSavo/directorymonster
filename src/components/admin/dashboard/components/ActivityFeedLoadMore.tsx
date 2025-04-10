"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';

interface ActivityFeedLoadMoreProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ActivityFeedLoadMore({
  onClick,
  isLoading = false,
  disabled = false,
}: ActivityFeedLoadMoreProps) {
  return (
    <div className="pt-2 pb-3 px-4 text-center">
      <Button
        onClick={onClick}
        variant="link"
        size="sm"
        isLoading={isLoading}
        disabled={disabled}
        data-testid="load-more-button"
      >
        Load more
      </Button>
    </div>
  );
}

export default ActivityFeedLoadMore;