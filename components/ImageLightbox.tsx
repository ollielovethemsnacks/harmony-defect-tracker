'use client';

import { useEffect, useCallback, useState, useRef } from 'react';

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onGoTo?: (index: number) => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
  onGoTo,
}: ImageLightboxProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'ArrowLeft') onPrev();
  }, [onClose, onNext, onPrev]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        onNext();
      } else {
        onPrev();
      }
    }
    setTouchStart(null);
  };

  if (!isOpen || !images.length) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${currentIndex + 1} of ${images.length}`}
    >
      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        Image {currentIndex + 1} of {images.length}
      </div>

      {/* Close button — min 44px tap target */}
      <button
        ref={closeBtnRef}
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white z-10 transition-colors"
        aria-label="Close image viewer"
      >
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image counter */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 text-white/80 text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Navigation arrows — min 44px tap targets */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
            aria-label="Previous image"
          >
            <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
            aria-label="Next image"
          >
            <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Main image */}
      <div
        className="w-full h-full flex items-center justify-center p-4 sm:p-16"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage}
          alt={`Defect image ${currentIndex + 1} of ${images.length}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 sm:px-4 py-2 bg-black/50 rounded-lg overflow-x-auto max-w-[90vw]">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onGoTo?.(idx);
              }}
              className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded overflow-hidden border-2 transition-colors min-w-[44px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                idx === currentIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-80'
              }`}
              aria-label={`Go to image ${idx + 1}`}
              aria-current={idx === currentIndex ? 'true' : undefined}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
