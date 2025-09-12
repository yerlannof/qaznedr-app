export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    info: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
  },
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
    '4xl': '6rem', // 96px
    '5xl': '8rem', // 128px
  },
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    },
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem', // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem', // 72px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px
    base: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.35)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: '0 0 #0000',
  },
  animation: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    overlay: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
    toast: 80,
    maximum: 999,
  },
};

// CSS Variables for runtime theming
export const cssVariables = `
  :root {
    /* Primary Colors */
    --color-primary-50: ${designTokens.colors.primary[50]};
    --color-primary-100: ${designTokens.colors.primary[100]};
    --color-primary-200: ${designTokens.colors.primary[200]};
    --color-primary-300: ${designTokens.colors.primary[300]};
    --color-primary-400: ${designTokens.colors.primary[400]};
    --color-primary-500: ${designTokens.colors.primary[500]};
    --color-primary-600: ${designTokens.colors.primary[600]};
    --color-primary-700: ${designTokens.colors.primary[700]};
    --color-primary-800: ${designTokens.colors.primary[800]};
    --color-primary-900: ${designTokens.colors.primary[900]};
    
    /* Gray Colors */
    --color-gray-50: ${designTokens.colors.gray[50]};
    --color-gray-100: ${designTokens.colors.gray[100]};
    --color-gray-200: ${designTokens.colors.gray[200]};
    --color-gray-300: ${designTokens.colors.gray[300]};
    --color-gray-400: ${designTokens.colors.gray[400]};
    --color-gray-500: ${designTokens.colors.gray[500]};
    --color-gray-600: ${designTokens.colors.gray[600]};
    --color-gray-700: ${designTokens.colors.gray[700]};
    --color-gray-800: ${designTokens.colors.gray[800]};
    --color-gray-900: ${designTokens.colors.gray[900]};
    
    /* Semantic Colors */
    --color-success: ${designTokens.colors.success[500]};
    --color-warning: ${designTokens.colors.warning[500]};
    --color-error: ${designTokens.colors.error[500]};
    --color-info: ${designTokens.colors.info[500]};
    
    /* Spacing */
    --spacing-xs: ${designTokens.spacing.xs};
    --spacing-sm: ${designTokens.spacing.sm};
    --spacing-md: ${designTokens.spacing.md};
    --spacing-lg: ${designTokens.spacing.lg};
    --spacing-xl: ${designTokens.spacing.xl};
    
    /* Typography */
    --font-sans: ${designTokens.typography.fontFamily.sans};
    --font-mono: ${designTokens.typography.fontFamily.mono};
    
    /* Border Radius */
    --radius-sm: ${designTokens.borderRadius.sm};
    --radius-md: ${designTokens.borderRadius.md};
    --radius-lg: ${designTokens.borderRadius.lg};
    --radius-xl: ${designTokens.borderRadius.xl};
    
    /* Shadows */
    --shadow-sm: ${designTokens.shadows.sm};
    --shadow-md: ${designTokens.shadows.md};
    --shadow-lg: ${designTokens.shadows.lg};
    
    /* Animation */
    --duration-fast: ${designTokens.animation.duration.fast};
    --duration-normal: ${designTokens.animation.duration.normal};
    --duration-slow: ${designTokens.animation.duration.slow};
    --easing-in-out: ${designTokens.animation.easing.inOut};
  }
  
  [data-theme="dark"] {
    /* Dark mode overrides */
    --color-primary-50: ${designTokens.colors.primary[950]};
    --color-primary-900: ${designTokens.colors.primary[50]};
    
    --color-gray-50: ${designTokens.colors.gray[950]};
    --color-gray-100: ${designTokens.colors.gray[900]};
    --color-gray-200: ${designTokens.colors.gray[800]};
    --color-gray-300: ${designTokens.colors.gray[700]};
    --color-gray-400: ${designTokens.colors.gray[600]};
    --color-gray-500: ${designTokens.colors.gray[500]};
    --color-gray-600: ${designTokens.colors.gray[400]};
    --color-gray-700: ${designTokens.colors.gray[300]};
    --color-gray-800: ${designTokens.colors.gray[200]};
    --color-gray-900: ${designTokens.colors.gray[100]};
  }
`;

export default designTokens;
