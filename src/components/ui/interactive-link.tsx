'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InteractiveLinkProps {
  href: string;
  children: ReactNode;
  variant?: 'default' | 'underline' | 'glow' | 'slide';
  className?: string;
  external?: boolean;
}

export function InteractiveLink({
  href,
  children,
  variant = 'default',
  className = '',
  external = false
}: InteractiveLinkProps) {
  const LinkComponent = external ? 'a' : Link;
  const linkProps = external ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href };

  if (variant === 'underline') {
    return (
      <LinkComponent {...linkProps} className={cn('relative group inline-block', className)}>
        <span className="relative">
          {children}
          <motion.span
            className="absolute bottom-0 left-0 h-0.5 bg-blue-600"
            initial={{ width: '0%' }}
            whileHover={{ width: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </span>
      </LinkComponent>
    );
  }

  if (variant === 'glow') {
    return (
      <LinkComponent {...linkProps}>
        <motion.span
          className={cn('relative inline-block', className)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {children}
          <motion.span
            className="absolute inset-0 rounded-lg bg-blue-600/20 blur-xl"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </motion.span>
      </LinkComponent>
    );
  }

  if (variant === 'slide') {
    return (
      <LinkComponent {...linkProps}>
        <motion.span
          className={cn('relative inline-block overflow-hidden', className)}
          whileHover="hover"
        >
          <motion.span
            className="block"
            variants={{
              hover: { y: '-100%' }
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {children}
          </motion.span>
          <motion.span
            className="absolute top-full left-0 block text-blue-600"
            variants={{
              hover: { y: '-100%' }
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {children}
          </motion.span>
        </motion.span>
      </LinkComponent>
    );
  }

  // Default variant with simple hover
  return (
    <LinkComponent {...linkProps}>
      <motion.span
        className={cn('inline-block transition-colors', className)}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {children}
      </motion.span>
    </LinkComponent>
  );
}

export function InteractiveButton({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  disabled = false,
  className = ''
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  className?: string;
}) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center font-medium rounded-lg transition-colors overflow-hidden',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <motion.span
        className="absolute inset-0 bg-white/20"
        initial={{ x: '-100%', y: '-100%' }}
        whileHover={!disabled ? { x: '100%', y: '100%' } : undefined}
        transition={{ duration: 0.5 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

export function MagneticButton({
  children,
  className = ''
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn('relative inline-block', className)}
      whileHover="hover"
    >
      <motion.div
        variants={{
          hover: {
            x: [0, -2, 2, -2, 2, 0],
            y: [0, -2, 2, -2, 2, 0],
            transition: { duration: 0.4 }
          }
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}