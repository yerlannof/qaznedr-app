'use client';

import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

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
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizes[size]} ${className}`}
    >
      <Loader2 className="w-full h-full text-blue-600" />
    </motion.div>
  );
}

export function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-blue-600 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export function LoadingPulse({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-30 animate-pulse" />
      <div className="relative bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800">
        <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <LoadingDots className="justify-center" />
      </div>
    </motion.div>
  );
}

export function LoadingOverlay({
  message = 'Загрузка...',
}: {
  message?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800"
      >
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-700 dark:text-gray-300">{message}</p>
      </motion.div>
    </motion.div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <LoadingPulse />
      </motion.div>
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
