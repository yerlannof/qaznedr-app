'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

// Enhanced Card with animations and glass-morphism
const CardEnhanced = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & {
    variant?: 'default' | 'glass' | 'gradient' | 'elevated';
    hover?: boolean;
  }
>(({ className, variant = 'default', hover = true, ...props }, ref) => {
  const variants = {
    default: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
    glass: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 dark:border-gray-700/50',
    gradient: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border border-gray-200 dark:border-gray-800',
    elevated: 'bg-white dark:bg-gray-900 shadow-xl',
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        'rounded-xl transition-all duration-300',
        variants[variant],
        hover && 'hover:shadow-xl hover:scale-[1.02]',
        className
      )}
      whileHover={hover ? { y: -4 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    />
  );
});
CardEnhanced.displayName = 'CardEnhanced';

// Enhanced Card Header with animation
const CardHeaderEnhanced = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    animated?: boolean;
  }
>(({ className, animated = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  >
    {children}
  </div>
));
CardHeaderEnhanced.displayName = 'CardHeaderEnhanced';

// Enhanced Card Title
const CardTitleEnhanced = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    gradient?: boolean;
  }
>(({ className, gradient = false, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      gradient && 'bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent',
      className
    )}
    {...props}
  >
    {children}
  </h3>
));
CardTitleEnhanced.displayName = 'CardTitleEnhanced';

// Enhanced Card Description
const CardDescriptionEnhanced = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600 dark:text-gray-400', className)}
    {...props}
  />
));
CardDescriptionEnhanced.displayName = 'CardDescriptionEnhanced';

// Enhanced Card Content
const CardContentEnhanced = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    animated?: boolean;
  }
>(({ className, animated = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-6 pt-0', className)}
    {...props}
  >
    {children}
  </div>
));
CardContentEnhanced.displayName = 'CardContentEnhanced';

// Enhanced Card Footer
const CardFooterEnhanced = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center p-6 pt-0',
      className
    )}
    {...props}
  />
));
CardFooterEnhanced.displayName = 'CardFooterEnhanced';

// Floating Card with hover effect
const FloatingCard = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'>
>(({ className, children, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative rounded-xl bg-white dark:bg-gray-900 p-6',
        'shadow-lg hover:shadow-2xl transition-shadow duration-300',
        'before:absolute before:inset-0 before:rounded-xl',
        'before:bg-gradient-to-br before:from-blue-500/10 before:to-purple-500/10',
        'before:opacity-0 hover:before:opacity-100 before:transition-opacity',
        'before:-z-10',
        className
      )}
      whileHover={{ 
        y: -8,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
});
FloatingCard.displayName = 'FloatingCard';

export {
  CardEnhanced,
  CardHeaderEnhanced,
  CardFooterEnhanced,
  CardTitleEnhanced,
  CardDescriptionEnhanced,
  CardContentEnhanced,
  FloatingCard,
};