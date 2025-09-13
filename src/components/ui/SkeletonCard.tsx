'use client';

import { motion } from 'framer-motion';

export default function SkeletonCard() {
  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Image skeleton */}
      <div className="aspect-[4/3] relative bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse" />
        </div>

        {/* Badge skeletons */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="w-12 h-6 bg-gray-300 rounded-full animate-pulse" />
          <div className="w-20 h-6 bg-gray-300 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <div className="w-3/4 h-5 bg-gray-300 rounded animate-pulse" />
          <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-100 rounded-lg p-2.5">
            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse mb-1" />
            <div className="w-16 h-4 bg-gray-300 rounded animate-pulse" />
          </div>
          <div className="bg-gray-100 rounded-lg p-2.5">
            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse mb-1" />
            <div className="w-16 h-4 bg-gray-300 rounded animate-pulse" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-gray-200 rounded animate-pulse" />
          <div className="w-4/5 h-3 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Price */}
        <div className="w-32 h-7 bg-gray-300 rounded animate-pulse" />

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
          <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Button */}
        <div className="w-full h-10 bg-gray-300 rounded-lg animate-pulse" />
      </div>
    </motion.div>
  );
}
