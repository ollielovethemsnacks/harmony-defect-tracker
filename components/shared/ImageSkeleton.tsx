'use client';

interface ImageSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton placeholder shown while images are being uploaded.
 * Provides visual continuity so the layout doesn't jump.
 */
export function ImageSkeleton({ count = 1, className = '' }: ImageSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`} aria-busy="true" aria-label="Loading images">
      {skeletons.map((i) => (
        <div
          key={i}
          className="w-full h-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
        />
      ))}
    </div>
  );
}
