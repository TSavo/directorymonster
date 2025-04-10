'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Zap } from 'lucide-react';
import { QuickAction } from './hooks/useQuickActions';

export interface QuickActionsPresentationProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  filteredActions: QuickAction[];
  handleSelect: (action: QuickAction) => void;
  className?: string;
  buttonLabel?: string;
  heading?: string;
  emptyMessage?: string;
}

export function QuickActionsPresentation({
  open,
  setOpen,
  filteredActions,
  handleSelect,
  className = '',
  buttonLabel = 'Quick Actions',
  heading = 'Quick Actions',
  emptyMessage = 'No actions found.'
}: QuickActionsPresentationProps) {
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-1 bg-white text-primary-600 border-primary-200 hover:bg-primary-50 hover:border-primary-300 transition-colors focus-visible ${className}`}
          onClick={() => setOpen(true)}
          data-testid="quick-actions-button"
        >
          <Zap className="h-4 w-4 text-primary-500" />
          <span className="hidden sm:inline font-medium">{buttonLabel}</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-neutral-50 px-1.5 font-mono text-[10px] font-medium text-neutral-500 ml-1">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 bg-white/95 backdrop-blur-sm border border-neutral-100 shadow-lg rounded-xl animate-fade-in" 
        align="end" 
        side="bottom" 
        sideOffset={8} 
        alignOffset={0} 
        forceMount
        data-testid="quick-actions-content"
      >
        <Command>
          <CommandInput placeholder="Search actions..." data-testid="quick-actions-search" />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup heading={heading} className="text-primary-600 font-medium">
              {filteredActions.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action)}
                  className="flex items-center gap-2 p-2 hover:bg-neutral-50 transition-colors"
                  data-testid={`quick-action-${action.id}`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-200 bg-white text-primary-500 mr-2">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">{action.name}</p>
                    <p className="text-xs text-neutral-500">{action.description}</p>
                  </div>
                  {action.shortcut && (
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-1.5 font-mono text-[10px] font-medium text-neutral-500">
                      {action.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
