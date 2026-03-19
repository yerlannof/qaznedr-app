'use client';

import { Loader2 } from 'lucide-react';

export function LoadingSpinner({
  size = 'default',
  className = '',
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`${sizes[size]} ${className} animate-spin`}>
      <Loader2 className="w-full h-full text-blue-600" />
    </div>
  );
}

export function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </div>
  );
}

export function LoadingPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800">
        <LoadingDots className="justify-center" />
      </div>
    </div>
  );
}

export function LoadingOverlay({
  message = 'Загрузка...',
}: {
  message?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-700 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingPulse />
    </div>
  );
}

export function InlineLoader({ text = 'Загрузка' }: { text?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <LoadingSpinner size="sm" />
      <span>{text}</span>
      <LoadingDots />
    </div>
  );
}
