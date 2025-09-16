// Professional placeholder images for different mineral types and categories
// Using Unsplash API for high-quality images

export const mineralPlaceholders = {
  Нефть: [
    'https://images.unsplash.com/photo-1568434373318-9ca2ccdbc879?w=800&h=600&fit=crop', // Oil refinery
    'https://images.unsplash.com/photo-1516617442634-75371039cb3a?w=800&h=600&fit=crop', // Oil platform
    'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=600&fit=crop', // Oil drilling
  ],
  Газ: [
    'https://images.unsplash.com/photo-1567098260939-5d9cee055592?w=800&h=600&fit=crop', // Gas facility
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop', // Gas pipelines
    'https://images.unsplash.com/photo-1581093450021-4a7360e7c6b7?w=800&h=600&fit=crop', // Gas storage
  ],
  Золото: [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', // Gold mining operation
    'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&h=600&fit=crop', // Gold bars
    'https://images.unsplash.com/photo-1624365168968-f281d0b3b3f8?w=800&h=600&fit=crop', // Gold mining equipment
  ],
  Медь: [
    'https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?w=800&h=600&fit=crop', // Copper mine
    'https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?w=800&h=600&fit=crop', // Copper ore
    'https://images.unsplash.com/photo-1617638924541-8f7e77b2b4e5?w=800&h=600&fit=crop', // Mining equipment
  ],
  Уголь: [
    'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800&h=600&fit=crop', // Coal mining facility
    'https://images.unsplash.com/photo-1564866652315-b64bbfadf820?w=800&h=600&fit=crop', // Coal mine
    'https://images.unsplash.com/photo-1598965402089-897ce52e8355?w=800&h=600&fit=crop', // Mining operation
  ],
  Уран: [
    'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&h=600&fit=crop', // Geological exploration
    'https://images.unsplash.com/photo-1586974726553-8b9190c03cc5?w=800&h=600&fit=crop', // Industrial complex
    'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=800&h=600&fit=crop', // Mining site
  ],
  Железо: [
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=600&fit=crop', // Iron ore mining trucks
    'https://images.unsplash.com/photo-1565514943780-4ee78a6936dd?w=800&h=600&fit=crop', // Iron ore
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&h=600&fit=crop', // Iron mine
  ],
  Свинец: [
    'https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?w=800&h=600&fit=crop', // Metal ore mining
    'https://images.unsplash.com/photo-1617638924541-8f7e77b2b4e5?w=800&h=600&fit=crop', // Mining equipment
    'https://images.unsplash.com/photo-1540080106973-411a95b50e57?w=800&h=600&fit=crop', // General mining
  ],
  Хром: [
    'https://images.unsplash.com/photo-1617638924541-8f7e77b2b4e5?w=800&h=600&fit=crop', // Mining equipment
    'https://images.unsplash.com/photo-1540080106973-411a95b50e57?w=800&h=600&fit=crop', // General mining
    'https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?w=800&h=600&fit=crop', // Mining operation
  ],
  default: [
    'https://images.unsplash.com/photo-1540080106973-411a95b50e57?w=800&h=600&fit=crop', // General mining
    'https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=800&h=600&fit=crop', // Industrial site
    'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800&h=600&fit=crop', // Mining operation
  ],
};

export const categoryPlaceholders = {
  MINING_LICENSE: [
    'https://images.unsplash.com/photo-1540080106973-411a95b50e57?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&h=600&fit=crop',
  ],
  EXPLORATION_LICENSE: [
    'https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1581093450021-4a7360e7c6b7?w=800&h=600&fit=crop',
  ],
  MINERAL_OCCURRENCE: [
    'https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1601132359864-c974e79890ac?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1545259742-b4fd8fea67e4?w=800&h=600&fit=crop',
  ],
};

export function getPlaceholderImage(mineral: string, type?: string): string {
  // Try to get mineral-specific placeholder
  const mineralImages =
    mineralPlaceholders[mineral as keyof typeof mineralPlaceholders] ||
    mineralPlaceholders.default;

  // If type is provided, mix with category placeholders
  if (type && categoryPlaceholders[type as keyof typeof categoryPlaceholders]) {
    const categoryImages =
      categoryPlaceholders[type as keyof typeof categoryPlaceholders];
    const allImages = [...mineralImages, ...categoryImages];
    return allImages[Math.floor(Math.random() * allImages.length)];
  }

  // Return random image from mineral placeholders
  return mineralImages[Math.floor(Math.random() * mineralImages.length)];
}

export function getStaticPlaceholder(index: number = 0): string {
  const allImages = Object.values(mineralPlaceholders).flat();
  return allImages[index % allImages.length];
}

// Generate gradient placeholder for loading states
export function getGradientPlaceholder(
  colors: [string, string] = ['#3b82f6', '#1e40af']
): string {
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
}

// Shimmer effect for loading placeholders
export const shimmerEffect = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
  
  .shimmer {
    animation: shimmer 2s infinite;
    background: linear-gradient(
      90deg,
      #f0f0f0 0%,
      #f8f8f8 50%,
      #f0f0f0 100%
    );
    background-size: 1000px 100%;
  }
`;
