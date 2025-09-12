'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  objectFit = 'cover',
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  fallbackSrc = '/images/placeholder.jpg',
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleError = () => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  // Generate blur data URL if not provided
  const getBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;

    // Simple SVG blur placeholder
    const shimmer = `
      <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g">
            <stop stop-color="#e5e7eb" offset="20%" />
            <stop stop-color="#f3f4f6" offset="50%" />
            <stop stop-color="#e5e7eb" offset="70%" />
          </linearGradient>
        </defs>
        <rect width="${width || 400}" height="${height || 300}" fill="#e5e7eb" />
        <rect id="r" width="${width || 400}" height="${height || 300}" fill="url(#g)" />
        <animate xlink:href="#r" attributeName="x" from="-${width || 400}" to="${width || 400}" dur="1s" repeatCount="indefinite" />
      </svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(shimmer).toString('base64')}`;
  };

  // Don't render image until it's in view (unless priority)
  if (!priority && !isInView) {
    return (
      <div
        ref={imgRef}
        className={cn('bg-gray-200 animate-pulse', className)}
        style={{
          width: width || '100%',
          height: height || 'auto',
        }}
      />
    );
  }

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={{
        width: width || '100%',
        height: height || 'auto',
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      <Image
        src={imgSrc}
        alt={alt}
        width={width || 800}
        height={height || 600}
        priority={priority}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        style={{
          objectFit,
        }}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? getBlurDataURL() : undefined}
        onLoad={handleLoad}
        onError={handleError}
        quality={85}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  );
}

// Responsive image component with art direction
interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'src'> {
  sources: {
    src: string;
    media?: string;
    width: number;
    height: number;
  }[];
  defaultSrc: string;
}

export function ResponsiveImage({
  sources,
  defaultSrc,
  alt,
  className,
  ...props
}: ResponsiveImageProps) {
  const [currentSource, setCurrentSource] = useState(defaultSrc);

  useEffect(() => {
    const updateSource = () => {
      for (const source of sources) {
        if (source.media && window.matchMedia(source.media).matches) {
          setCurrentSource(source.src);
          return;
        }
      }
      setCurrentSource(defaultSrc);
    };

    updateSource();
    window.addEventListener('resize', updateSource);

    return () => window.removeEventListener('resize', updateSource);
  }, [sources, defaultSrc]);

  return (
    <OptimizedImage
      src={currentSource}
      alt={alt}
      className={className}
      {...props}
    />
  );
}

// Progressive image loading component
interface ProgressiveImageProps {
  src: string;
  alt: string;
  thumbnailSrc?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function ProgressiveImage({
  src,
  alt,
  thumbnailSrc,
  className,
  width,
  height,
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc || src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!thumbnailSrc) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };

    return () => {
      img.onload = null;
    };
  }, [src, thumbnailSrc]);

  return (
    <div className={cn('relative', className)}>
      <OptimizedImage
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'transition-all duration-700',
          !isLoaded && thumbnailSrc ? 'filter blur-sm scale-105' : ''
        )}
      />
    </div>
  );
}
