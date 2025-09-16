'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'dark';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
  className?: string;
}

export function GlassCard({
  children,
  variant = 'default',
  blur = 'md',
  hover = true,
  glow = false,
  className,
  ...motionProps
}: GlassCardProps) {
  const blurValues = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl'
  };

  const variants = {
    default: 'bg-white/80 dark:bg-gray-900/80 border-gray-200/50 dark:border-gray-700/50',
    primary: 'bg-blue-50/80 dark:bg-blue-950/80 border-blue-200/50 dark:border-blue-800/50',
    secondary: 'bg-gray-50/80 dark:bg-gray-800/80 border-gray-300/50 dark:border-gray-600/50',
    dark: 'bg-gray-900/90 border-gray-700/50 text-white'
  };

  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'relative rounded-2xl border shadow-lg',
        blurValues[blur],
        variants[variant],
        hover && 'transition-all duration-300 hover:shadow-2xl',
        glow && 'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-blue-600/20 before:to-purple-600/20 before:blur-xl before:-z-10',
        className
      )}
      {...motionProps}
    >
      {glow && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-2xl -z-10"
          animate={{
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
      {children}
    </motion.div>
  );
}

export function GlassModal({
  children,
  isOpen,
  onClose,
  title
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="default" blur="xl" hover={false} className="p-6">
          {title && (
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {title}
            </h2>
          )}
          {children}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

export function GlassButton({
  children,
  variant = 'default',
  size = 'default',
  className,
  onClick,
  ...props
}: {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  onClick?: () => void;
} & HTMLMotionProps<'button'>) {
  const variants = {
    default: 'bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white hover:bg-white/90 dark:hover:bg-gray-800/90',
    primary: 'bg-blue-600/80 text-white hover:bg-blue-600/90',
    ghost: 'bg-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'relative rounded-xl font-medium backdrop-blur-md border border-white/20 dark:border-gray-700/20 shadow-lg transition-all duration-300',
        variants[variant],
        sizes[size],
        className
      )}
      onClick={onClick}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/10 to-purple-600/10"
        animate={{
          opacity: [0, 0.5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </motion.button>
  );
}