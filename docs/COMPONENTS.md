# Component Library Documentation

## Overview

This document provides a comprehensive guide to all React components in the QAZNEDR platform. Components are organized by category and follow a consistent design system.

## Design System

### Color Palette

- **Primary**: Blue (#0A84FF)
- **Grays**: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900
- **Background**: White (#FFFFFF)
- **Text**: Gray-900 for headings, Gray-600 for body

### Typography

- **Font**: Inter (system-ui fallback)
- **Sizes**: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl
- **Weights**: font-normal (400), font-medium (500), font-semibold (600), font-bold (700)

### Spacing

- **Padding**: p-2 (8px), p-4 (16px), p-6 (24px), p-8 (32px)
- **Margin**: m-2 (8px), m-4 (16px), m-6 (24px), m-8 (32px)
- **Gap**: gap-2 (8px), gap-4 (16px), gap-6 (24px), gap-8 (32px)

## Component Categories

### 1. UI Components (`/components/ui/`)

#### Button

**Path**: `src/components/ui/button.tsx`
**Props**:

- `variant`: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
- `size`: "default" | "sm" | "lg" | "icon"
- Standard HTML button props

**Example**:

```tsx
<Button variant="default" size="lg" onClick={handleClick}>
  Submit
</Button>
```

#### Card

**Path**: `src/components/ui/card-new.tsx`
**Components**:

- `Card` - Container with shadow and border
- `CardHeader` - Header section with optional title/description
- `CardContent` - Main content area
- `CardFooter` - Footer with actions

**Example**:

```tsx
<Card className="hover:shadow-md transition-all">
  <CardHeader>
    <CardTitle>Mining License</CardTitle>
    <CardDescription>Gold extraction permit</CardDescription>
  </CardHeader>
  <CardContent>
    <p>License details...</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

#### Badge

**Path**: `src/components/ui/badge.tsx`
**Props**:

- `variant`: "default" | "secondary" | "destructive" | "outline"
- `className`: Additional CSS classes

**Example**:

```tsx
<Badge variant="secondary">Verified</Badge>
```

#### Input

**Path**: `src/components/ui/input.tsx`
**Props**:

- Standard HTML input props
- `className`: Additional styling

**Example**:

```tsx
<Input
  type="email"
  placeholder="Enter email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### Select

**Path**: `src/components/ui/select.tsx`
**Components**:

- `Select` - Root component
- `SelectTrigger` - Clickable trigger
- `SelectContent` - Dropdown content
- `SelectItem` - Individual option

**Example**:

```tsx
<Select value={mineral} onValueChange={setMineral}>
  <SelectTrigger>
    <SelectValue placeholder="Select mineral" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="gold">Gold</SelectItem>
    <SelectItem value="copper">Copper</SelectItem>
  </SelectContent>
</Select>
```

#### Dialog

**Path**: `src/components/ui/dialog.tsx`
**Components**:

- `Dialog` - Root component
- `DialogTrigger` - Opens dialog
- `DialogContent` - Modal content
- `DialogHeader` - Header section
- `DialogTitle` - Title text
- `DialogDescription` - Description text

**Example**:

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Details</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>License Details</DialogTitle>
      <DialogDescription>
        View complete information about this mining license
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

#### LanguageSwitcher

**Path**: `src/components/ui/LanguageSwitcherNew.tsx`
**Description**: Language selector for i18n (KZ, RU, EN)
**Props**: None (uses next-intl hooks internally)

**Example**:

```tsx
<LanguageSwitcher />
```

### 2. Feature Components (`/components/features/`)

#### ListingsFilters

**Path**: `src/components/features/ListingsFilters.tsx`
**Props**:

- `filters`: Current filter state
- `onFiltersChange`: Callback for filter updates
- `onClearFilters`: Clear all filters

**Filter Options**:

- Type (Mining/Exploration/Occurrence)
- Mineral (Gold, Copper, etc.)
- Region (14 Kazakhstan regions)
- Price range
- Area range
- Status (Active/Pending/Sold)

**Example**:

```tsx
<ListingsFilters
  filters={filters}
  onFiltersChange={handleFilterChange}
  onClearFilters={handleClearFilters}
/>
```

#### DepositMap

**Path**: `src/components/features/DepositMap.tsx`
**Props**:

- `deposits`: Array of KazakhstanDeposit objects
- `selectedDeposit`: Currently selected deposit
- `onDepositSelect`: Selection callback
- `height`: Map height (default: "600px")

**Features**:

- Interactive MapLibre GL map
- Custom markers for each listing type
- Popup with deposit details
- Zoom controls

**Example**:

```tsx
<DepositMap
  deposits={deposits}
  selectedDeposit={selected}
  onDepositSelect={handleSelect}
  height="500px"
/>
```

#### SearchBar

**Path**: `src/components/features/SearchBar.tsx`
**Props**:

- `value`: Search query
- `onChange`: Query change handler
- `placeholder`: Input placeholder
- `className`: Additional styling

**Example**:

```tsx
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search by title, mineral, or location..."
/>
```

#### PriceTrendAnalytics

**Path**: `src/components/features/PriceTrendAnalytics.tsx`
**Props**:

- `data`: Array of price trend data
- `mineralDistribution`: Pie chart data
- `className`: Additional styling

**Charts**:

- Line chart for price trends
- Pie chart for mineral distribution
- Uses Recharts library

**Example**:

```tsx
<PriceTrendAnalytics data={priceTrends} mineralDistribution={distribution} />
```

#### Recommendations

**Path**: `src/components/features/Recommendations.tsx`
**Props**:

- `currentListing`: Reference listing for recommendations
- `limit`: Number of recommendations (default: 4)

**Algorithm**:

- Matches by mineral type
- Matches by region
- Price similarity scoring

**Example**:

```tsx
<Recommendations currentListing={listing} limit={6} />
```

### 3. Card Components (`/components/cards/`)

#### MiningLicenseCard

**Path**: `src/components/cards/MiningLicenseCard.tsx`
**Props**:

- `deposit`: KazakhstanDeposit object
- `onClick`: Click handler
- `onFavorite`: Favorite toggle handler
- `isFavorite`: Favorite state
- `locale`: Current language locale

**Features**:

- Image carousel
- Price formatting
- Area display
- Mineral badges
- Favorite button
- Hover effects

**Example**:

```tsx
<MiningLicenseCard
  deposit={deposit}
  onClick={() => router.push(`/listings/${deposit.id}`)}
  onFavorite={handleFavorite}
  isFavorite={isFavorite}
  locale="ru"
/>
```

### 4. Layout Components (`/components/layouts/`)

#### Navigation

**Path**: `src/components/layouts/Navigation.tsx`
**Props**: None (uses router and i18n context)

**Sections**:

- Logo with home link
- Main navigation menu
- Search bar
- Language switcher
- User menu (auth state aware)

**Example**:

```tsx
<Navigation />
```

#### NavigationSimple

**Path**: `src/components/layouts/NavigationSimple.tsx`
**Props**: None

**Description**: Simplified navigation for landing pages

- Logo only
- Language switcher
- Sign in/up buttons

**Example**:

```tsx
<NavigationSimple />
```

#### Footer

**Path**: `src/components/layouts/Footer.tsx`
**Props**: None

**Sections**:

- Company info
- Quick links
- Services
- Contact information
- Social media links

**Example**:

```tsx
<Footer />
```

### 5. Detail Section Components (`/components/detail-sections/`)

#### MiningLicenseDetails

**Path**: `src/components/detail-sections/MiningLicenseDetails.tsx`
**Props**:

- `deposit`: KazakhstanDeposit with MINING_LICENSE type
- `locale`: Current language

**Displays**:

- License number and expiry
- Annual production limit
- Operational details
- Environmental compliance

**Example**:

```tsx
<MiningLicenseDetails deposit={miningLicense} locale="ru" />
```

#### ExplorationLicenseDetails

**Path**: `src/components/detail-sections/ExplorationLicenseDetails.tsx`
**Props**:

- `deposit`: KazakhstanDeposit with EXPLORATION_LICENSE type
- `locale`: Current language

**Displays**:

- Exploration stage
- Exploration period
- Budget information
- Geological data

**Example**:

```tsx
<ExplorationLicenseDetails deposit={explorationLicense} locale="kz" />
```

#### MineralOccurrenceDetails

**Path**: `src/components/detail-sections/MineralOccurrenceDetails.tsx`
**Props**:

- `deposit`: KazakhstanDeposit with MINERAL_OCCURRENCE type
- `locale`: Current language

**Displays**:

- Discovery date
- Geological confidence
- Estimated reserves
- Research data

**Example**:

```tsx
<MineralOccurrenceDetails deposit={occurrence} locale="en" />
```

## Component Patterns

### 1. Conditional Rendering Pattern

```tsx
{
  condition && <Component />;
}

{
  condition ? <ComponentA /> : <ComponentB />;
}
```

### 2. Data Mapping Pattern

```tsx
{
  items.map((item) => <ItemComponent key={item.id} {...item} />);
}
```

### 3. Event Handler Pattern

```tsx
const handleClick = useCallback(
  (id: string) => {
    // Handle event
  },
  [dependencies]
);
```

### 4. Loading State Pattern

```tsx
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;
```

### 5. Form Handling Pattern

```tsx
const [formData, setFormData] = useState(initialState);

const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  // Process form
};
```

## Styling Guidelines

### 1. Component Classes

- Use Tailwind CSS utility classes
- Combine with cn() for conditional classes
- Keep hover effects subtle (hover:shadow-md)

### 2. Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Use responsive utilities: sm:, md:, lg:, xl:

### 3. Animation

- Limited to transitions: transition-all, transition-colors
- Duration: duration-200 or duration-300
- No complex animations or transforms

### 4. Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Testing Components

### Unit Testing

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Integration Testing

```tsx
import { render, fireEvent } from '@testing-library/react';
import { ListingsFilters } from '@/components/features/ListingsFilters';

test('filter updates on selection', () => {
  const handleChange = jest.fn();
  const { getByRole } = render(
    <ListingsFilters onFiltersChange={handleChange} />
  );

  fireEvent.change(getByRole('combobox'), {
    target: { value: 'MINING_LICENSE' },
  });

  expect(handleChange).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'MINING_LICENSE' })
  );
});
```

## Component Checklist

When creating new components:

- [ ] TypeScript interfaces defined
- [ ] Props documented with JSDoc
- [ ] Default props provided where appropriate
- [ ] Error boundaries implemented for complex components
- [ ] Loading and error states handled
- [ ] Responsive design tested
- [ ] Accessibility attributes added
- [ ] Unit tests written
- [ ] Storybook story created (if applicable)
- [ ] Performance optimized (memo, useMemo, useCallback)

## Import Conventions

```tsx
// External libraries
import React from 'react';
import { useRouter } from 'next/navigation';

// Internal components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card-new';

// Types
import type { KazakhstanDeposit } from '@/lib/types/listing';

// Utils and hooks
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

// Styles (if any)
import styles from './Component.module.css';
```

## Performance Optimization

### 1. Code Splitting

- Use dynamic imports for heavy components
- Lazy load below-the-fold content

### 2. Memoization

- Use React.memo for pure components
- useMemo for expensive computations
- useCallback for stable function references

### 3. Image Optimization

- Use next/image component
- Provide width and height
- Use appropriate formats (WebP, AVIF)

### 4. Bundle Size

- Tree-shake unused imports
- Monitor with bundle analyzer
- Lazy load third-party libraries

## Troubleshooting

### Common Issues

1. **Component not rendering**
   - Check import paths
   - Verify prop types
   - Check for console errors

2. **Styling not applied**
   - Verify Tailwind classes
   - Check for CSS conflicts
   - Ensure proper className usage

3. **State not updating**
   - Check for immutable updates
   - Verify dependency arrays
   - Use React DevTools

4. **Performance issues**
   - Profile with React DevTools
   - Check for unnecessary re-renders
   - Optimize heavy computations
