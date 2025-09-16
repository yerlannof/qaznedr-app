'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderSrc?: string;
  blur?: boolean;
  priority?: boolean;
}

export function LazyImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = '',
  placeholderSrc,
  blur = true,
  priority = false
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Placeholder/Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse">
          {placeholderSrc && (
            <Image
              src={placeholderSrc}
              alt=""
              fill
              className="object-cover opacity-50"
              unoptimized
            />
          )}
        </div>
      )}

      {/* Main Image */}
      {(isInView || priority) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <Image
            src={src}
            alt={alt}
            fill
            className={cn(
              'object-cover',
              blur && !isLoaded && 'blur-sm'
            )}
            onLoad={() => setIsLoaded(true)}
            priority={priority}
            sizes={`${width}px`}
          />
        </motion.div>
      )}
    </div>
  );
}

export function LazyBackground({
  src,
  children,
  className = '',
  overlay = true
}: {
  src: string;
  children: React.ReactNode;
  className?: string;
  overlay?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Background Image */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ 
          scale: isLoaded ? 1 : 1.1, 
          opacity: isLoaded ? 1 : 0 
        }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          onLoad={() => setIsLoaded(true)}
          priority
        />
      </motion.div>

      {/* Overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Loading Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}
    </div>
  );
}