'use client';

import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';

interface FilterOptions {
  priceRange: [number, number];
  regions: string[];
  mineralTypes: string[];
  areaRange: {
    min: number | null;
    max: number | null;
  };
  sortBy: string;
}

interface ListingFiltersSidebarProps {
  onFiltersChange?: (filters: FilterOptions) => void;
  className?: string;
}

const regions = [
  'Taraz',
  'Shymkent',
  'Almaty',
  'Astana',
  'Karaganda',
  'Aktobe',
  'Atyrau',
  'Pavlodar',
];

const mineralTypes = [
  'Gold',
  'Copper',
  'Oil',
  'Natural Gas',
  'Coal',
  'Iron',
  'Uranium',
  'Lead',
  'Zinc',
];

const sortOptions = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'area-asc', label: 'Area: Small to Large' },
  { value: 'area-desc', label: 'Area: Large to Small' },
  { value: 'date-newest', label: 'Date: Newest First' },
  { value: 'date-oldest', label: 'Date: Oldest First' },
];

export default function ListingFiltersSidebar({
  onFiltersChange,
  className = '',
}: ListingFiltersSidebarProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, 1000000],
    regions: [],
    mineralTypes: [],
    areaRange: { min: null, max: null },
    sortBy: 'date-newest',
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const updateFilters = (updates: Partial<FilterOptions>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleRegionToggle = (region: string) => {
    const newRegions = filters.regions.includes(region)
      ? filters.regions.filter((r) => r !== region)
      : [...filters.regions, region];
    updateFilters({ regions: newRegions });
  };

  const handleMineralToggle = (mineral: string) => {
    const newMinerals = filters.mineralTypes.includes(mineral)
      ? filters.mineralTypes.filter((m) => m !== mineral)
      : [...filters.mineralTypes, mineral];
    updateFilters({ mineralTypes: newMinerals });
  };

  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      priceRange: [0, 1000000],
      regions: [],
      mineralTypes: [],
      areaRange: { min: null, max: null },
      sortBy: 'date-newest',
    };
    setFilters(defaultFilters);
    onFiltersChange?.(defaultFilters);
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Price Range</Label>
        <div className="px-1">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) =>
              updateFilters({ priceRange: value as [number, number] })
            }
            max={1000000}
            step={10000}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>${filters.priceRange[0].toLocaleString()}</span>
            <span>${filters.priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Sort By */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Sort By</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value) => updateFilters({ sortBy: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select sorting" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Regions */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Regions</Label>
        <div className="space-y-2">
          {regions.map((region) => (
            <div key={region} className="flex items-center space-x-2">
              <Checkbox
                id={`region-${region}`}
                checked={filters.regions.includes(region)}
                onCheckedChange={() => handleRegionToggle(region)}
              />
              <Label
                htmlFor={`region-${region}`}
                className="text-sm font-normal cursor-pointer"
              >
                {region}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Mineral Types */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Mineral Types</Label>
        <div className="space-y-2">
          {mineralTypes.map((mineral) => (
            <div key={mineral} className="flex items-center space-x-2">
              <Checkbox
                id={`mineral-${mineral}`}
                checked={filters.mineralTypes.includes(mineral)}
                onCheckedChange={() => handleMineralToggle(mineral)}
              />
              <Label
                htmlFor={`mineral-${mineral}`}
                className="text-sm font-normal cursor-pointer"
              >
                {mineral}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Area Range */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Area Range (hectares)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="area-min" className="text-xs text-gray-600">
              Min
            </Label>
            <Input
              id="area-min"
              type="number"
              placeholder="0"
              value={filters.areaRange.min || ''}
              onChange={(e) =>
                updateFilters({
                  areaRange: {
                    ...filters.areaRange,
                    min: e.target.value ? parseInt(e.target.value) : null,
                  },
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="area-max" className="text-xs text-gray-600">
              Max
            </Label>
            <Input
              id="area-max"
              type="number"
              placeholder="Any"
              value={filters.areaRange.max || ''}
              onChange={(e) =>
                updateFilters({
                  areaRange: {
                    ...filters.areaRange,
                    max: e.target.value ? parseInt(e.target.value) : null,
                  },
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <Button onClick={resetFilters} variant="outline" className="w-full">
        Reset Filters
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block w-64 shrink-0 ${className}`}>
        <div className="sticky top-6 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-6">Filters</h2>
          {filterContent}
        </div>
      </aside>

      {/* Mobile Filter Panel */}
      {showMobileFilters && (
        <div className="lg:hidden mb-6 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-6">Filters</h2>
          {filterContent}
        </div>
      )}
    </>
  );
}
