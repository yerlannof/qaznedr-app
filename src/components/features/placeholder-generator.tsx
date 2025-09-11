export const mineralGradients = {
  quartz: {
    start: '#f3e5f5',
    end: '#e1bee7',
    accent: '#ce93d8',
  },
  amethyst: {
    start: '#ede7f6',
    end: '#d1c4e9',
    accent: '#b39ddb',
  },
  pyrite: {
    start: '#fffde7',
    end: '#fff9c4',
    accent: '#fff176',
  },
  obsidian: {
    start: '#eceff1',
    end: '#cfd8dc',
    accent: '#b0bec5',
  },
  turquoise: {
    start: '#e0f2f1',
    end: '#b2dfdb',
    accent: '#80cbc4',
  },
  rose: {
    start: '#fce4ec',
    end: '#f8bbd0',
    accent: '#f48fb1',
  },
};

export function generatePlaceholder(
  type: keyof typeof mineralGradients,
  width: number = 400,
  height: number = 300
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  const gradient = mineralGradients[type] || mineralGradients.quartz;

  // Create gradient
  const linearGradient = ctx.createLinearGradient(0, 0, width, height);
  linearGradient.addColorStop(0, gradient.start);
  linearGradient.addColorStop(0.5, gradient.end);
  linearGradient.addColorStop(1, gradient.accent);

  ctx.fillStyle = linearGradient;
  ctx.fillRect(0, 0, width, height);

  // Add subtle pattern
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * width,
      Math.random() * height,
      Math.random() * 100 + 50,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = gradient.accent;
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
}

export function getPlaceholderUrl(mineralType: string): string {
  const typeMap: Record<string, keyof typeof mineralGradients> = {
    'Crystal Specimen': 'quartz',
    'Amethyst Geode': 'amethyst',
    'Pyrite Cube': 'pyrite',
    'Black Obsidian': 'obsidian',
    'Turquoise Stone': 'turquoise',
    'Rose Quartz': 'rose',
    'Clear Quartz': 'quartz',
    'Citrine Crystal': 'pyrite',
    Fluorite: 'amethyst',
    Labradorite: 'obsidian',
  };

  const gradientType = typeMap[mineralType] || 'quartz';
  return `/api/placeholder/${gradientType}`;
}
