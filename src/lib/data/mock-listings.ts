export interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  seller: string;
  location: string;
  category: string;
  images: string[];
  createdAt: Date;
  featured?: boolean;
}

export const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Amethyst Geode',
    price: 250,
    description:
      'Beautiful purple amethyst geode from Brazil. Perfect for display.',
    seller: 'Crystal Collector',
    location: 'São Paulo, Brazil',
    category: 'Geodes',
    images: ['/api/placeholder/amethyst'],
    createdAt: new Date('2024-01-15'),
    featured: true,
  },
  {
    id: '2',
    title: 'Rose Quartz Sphere',
    price: 120,
    description:
      'Polished rose quartz sphere, 3 inches diameter. Excellent clarity.',
    seller: 'Mineral Maven',
    location: 'Sedona, AZ',
    category: 'Polished Stones',
    images: ['/api/placeholder/rose'],
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    title: 'Pyrite Cube Collection',
    price: 180,
    description: 'Set of 5 natural pyrite cubes from Spain. Various sizes.',
    seller: 'Rock Hound',
    location: 'Madrid, Spain',
    category: 'Minerals',
    images: ['/api/placeholder/pyrite'],
    createdAt: new Date('2024-01-18'),
    featured: true,
  },
  {
    id: '4',
    title: 'Black Obsidian Mirror',
    price: 350,
    description: 'Hand-polished obsidian scrying mirror. 6 inch diameter.',
    seller: 'Mystic Minerals',
    location: 'Portland, OR',
    category: 'Polished Stones',
    images: ['/api/placeholder/obsidian'],
    createdAt: new Date('2024-01-22'),
  },
  {
    id: '5',
    title: 'Turquoise Cabochons',
    price: 90,
    description:
      'Natural turquoise cabochons, set of 10. Ready for jewelry making.',
    seller: 'Southwest Gems',
    location: 'Albuquerque, NM',
    category: 'Cabochons',
    images: ['/api/placeholder/turquoise'],
    createdAt: new Date('2024-01-19'),
  },
  {
    id: '6',
    title: 'Clear Quartz Points',
    price: 75,
    description: 'Bundle of 6 clear quartz points. Naturally terminated.',
    seller: 'Crystal Clear Co',
    location: 'Hot Springs, AR',
    category: 'Crystals',
    images: ['/api/placeholder/quartz'],
    createdAt: new Date('2024-01-21'),
    featured: true,
  },
  {
    id: '7',
    title: 'Citrine Crystal Cluster',
    price: 420,
    description:
      'Large citrine cluster from Brazil. Natural color, not heat treated.',
    seller: 'Gem Hunter',
    location: 'Rio de Janeiro, Brazil',
    category: 'Crystals',
    images: ['/api/placeholder/pyrite'],
    createdAt: new Date('2024-01-17'),
  },
  {
    id: '8',
    title: 'Fluorite Octahedrons',
    price: 65,
    description: 'Purple and green fluorite octahedrons. Set of 3 specimens.',
    seller: 'Mineral Magic',
    location: 'Tucson, AZ',
    category: 'Minerals',
    images: ['/api/placeholder/amethyst'],
    createdAt: new Date('2024-01-23'),
  },
  {
    id: '9',
    title: 'Labradorite Slab',
    price: 280,
    description: 'Polished labradorite slab with brilliant blue flash.',
    seller: 'Northern Lights Minerals',
    location: 'Helsinki, Finland',
    category: 'Polished Stones',
    images: ['/api/placeholder/obsidian'],
    createdAt: new Date('2024-01-16'),
  },
  {
    id: '10',
    title: 'Crystal Specimen Collection',
    price: 550,
    description:
      'Curated collection of 12 different crystal specimens with display case.',
    seller: 'Museum Minerals',
    location: 'Denver, CO',
    category: 'Collections',
    images: ['/api/placeholder/quartz'],
    createdAt: new Date('2024-01-14'),
    featured: true,
  },
];
