import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-blue-600 text-white shadow hover:bg-blue-700 hover:shadow-md focus-visible:ring-blue-600',
        destructive:
          'bg-gray-700 text-white shadow-sm hover:bg-gray-800 hover:shadow-md focus-visible:ring-gray-700',
        outline:
          'border border-gray-300 bg-white text-gray-900 shadow-sm hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-400',
        secondary:
          'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 hover:shadow-md focus-visible:ring-gray-400',
        ghost:
          'text-gray-900 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400',
        link: 'text-blue-600 underline-offset-4 hover:underline hover:text-blue-700 focus-visible:ring-blue-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8',
        xl: 'h-14 rounded-lg px-10 text-base',
        icon: 'h-10 w-10',
      },
      loading: {
        true: 'cursor-wait',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      loading: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && leftIcon && <span className="mr-1">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-1">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
