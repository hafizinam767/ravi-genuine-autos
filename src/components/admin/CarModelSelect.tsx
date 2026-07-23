'use client';

import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CarModelOption {
  id: string;
  name: string;
  make: string;
}

interface CarModelSelectProps {
  carModels: CarModelOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
}

export default function CarModelSelect({
  carModels,
  value,
  onChange,
  error,
  id = 'product-car-model',
}: CarModelSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find currently selected model
  const selectedModel = useMemo(
    () => carModels.find((cm) => cm.id === value),
    [carModels, value]
  );

  // Filter car models fast & responsively based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return carModels;
    const query = searchQuery.toLowerCase().trim();
    return carModels.filter(
      (cm) =>
        cm.make.toLowerCase().includes(query) ||
        cm.name.toLowerCase().includes(query) ||
        `${cm.make} ${cm.name}`.toLowerCase().includes(query)
    );
  }, [carModels, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal hover:bg-background',
            !value && 'text-muted-foreground',
            error && 'border-red-500 ring-1 ring-red-500'
          )}
        >
          <span className="truncate">
            {selectedModel ? `${selectedModel.make} ${selectedModel.name}` : 'Select car model'}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg"
        align="start"
      >
        <div className="flex flex-col">
          {/* Search Input Bar */}
          <div className="relative border-b p-2">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search car model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-8 text-sm focus-visible:ring-1"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Car Models List */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredModels.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No car models found.
              </div>
            ) : (
              filteredModels.map((cm) => {
                const isSelected = cm.id === value;
                const label = `${cm.make} ${cm.name}`;
                return (
                  <button
                    key={cm.id}
                    type="button"
                    onClick={() => {
                      onChange(cm.id);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors text-left',
                      isSelected
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'hover:bg-muted/70 text-foreground'
                    )}
                  >
                    <span className="truncate">{label}</span>
                    {isSelected && <Check className="ml-2 size-4 text-red-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
