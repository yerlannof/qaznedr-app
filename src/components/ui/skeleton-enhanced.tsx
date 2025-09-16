'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'shimmer';
}

function SkeletonEnhanced({
  className,
  variant = 'default',
  width,
  height,
  animation = 'shimmer',
  ...props
}: SkeletonProps) {
  const baseClasses = 'relative overflow-hidden bg-gray-200 dark:bg-gray-800';
  
  const variantClasses = {
    default: 'rounded-md',
    text: 'rounded-md h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: '',
    shimmer: '',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{ width, height }}
      {...props}
    >
      {animation === 'shimmer' && (
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ translateX: '200%' }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
          }}
        />
      )}
      {animation === 'wave' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      )}
    </div>
  );
}

// Skeleton Card Component
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <SkeletonEnhanced variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <SkeletonEnhanced variant="text" width="60%" />
          <SkeletonEnhanced variant="text" width="40%" />
        </div>
      </div>
      <SkeletonEnhanced variant="rectangular" height={120} />
      <div className="space-y-2">
        <SkeletonEnhanced variant="text" />
        <SkeletonEnhanced variant="text" width="80%" />
      </div>
    </div>
  );
}

// Skeleton List Component
function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-900 rounded-lg">
          <SkeletonEnhanced variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <SkeletonEnhanced variant="text" width="70%" />
            <SkeletonEnhanced variant="text" width="40%" height={12} />
          </div>
          <SkeletonEnhanced variant="rectangular" width={60} height={24} />
        </div>
      ))}
    </div>
  );
}

export { SkeletonEnhanced, SkeletonCard, SkeletonList };