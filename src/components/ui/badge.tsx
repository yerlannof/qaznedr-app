import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md py-1 px-2.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
        blue: 'bg-[rgba(10,132,255,0.08)] text-[#0A84FF] border border-[rgba(10,132,255,0.15)]',
        success:
          'bg-[rgba(52,199,89,0.08)] text-green-700 border border-[rgba(52,199,89,0.15)] dark:text-green-400',
        warning:
          'bg-[rgba(234,179,8,0.08)] text-yellow-700 border border-[rgba(234,179,8,0.15)] dark:text-yellow-400',
        error:
          'bg-[rgba(255,59,48,0.08)] text-red-600 border border-[rgba(255,59,48,0.15)] dark:text-red-400',
        gold: 'bg-[rgba(200,162,75,0.12)] text-[#8a6d1f] border border-[rgba(200,162,75,0.30)] dark:text-[#e0c674] dark:border-[rgba(200,162,75,0.25)]',
        // Aliases for backward compatibility
        secondary:
          'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
        destructive:
          'bg-[rgba(255,59,48,0.08)] text-red-600 border border-[rgba(255,59,48,0.15)] dark:text-red-400',
        outline:
          'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
