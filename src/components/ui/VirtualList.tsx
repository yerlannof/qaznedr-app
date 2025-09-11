/**
 * Virtual List Component for efficient rendering of large lists
 */

'use client';

import { useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 3,
  onScroll,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const { startIndex, visibleItems } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    // Add overscan
    const startWithOverscan = Math.max(0, start - overscan);
    const endWithOverscan = Math.min(items.length - 1, end + overscan);

    const visible = items.slice(startWithOverscan, endWithOverscan + 1);

    return {
      startIndex: startWithOverscan,
      visibleItems: visible,
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  };

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{
                height: itemHeight,
                overflow: 'hidden',
              }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook for virtual list with search and filtering
export function useVirtualList<T>(
  items: T[],
  {
    searchTerm = '',
    searchFields = [],
    filterFn,
  }: {
    itemHeight?: number;
    containerHeight?: number;
    searchTerm?: string;
    searchFields?: (keyof T)[];
    filterFn?: (item: T) => boolean;
  }
) {
  const filteredItems = useMemo(() => {
    let result = items;

    // Apply search filter
    if (searchTerm && searchFields.length > 0) {
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          return false;
        })
      );
    }

    // Apply custom filter
    if (filterFn) {
      result = result.filter(filterFn);
    }

    return result;
  }, [items, searchTerm, searchFields, filterFn]);

  return {
    items: filteredItems,
    totalCount: items.length,
    filteredCount: filteredItems.length,
  };
}
