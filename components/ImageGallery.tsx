'use client';

import { useState, useCallback } from 'react';
import { ImageLightbox } from './ImageLightbox';
import { ImageOff } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  onDelete?: (index: number) => void;
  allowDelete?: boolean;
}

interface ImageStatus {
  loaded: boolean;
  error: boolean;
}

export function ImageGallery({ images, onDelete, allowDelete = false }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageStatuses, setImageStatuses] = useState<Record<number, ImageStatus>>({});

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <ImageOff className="w-12 h-12 mx-auto mb-3 text-gray-300" aria-hidden="true" />
        <p>No images uploaded</p>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(index);
    }
  };

  const handleImageLoad = useCallback((index: number) => {
    setImageStatuses(prev => ({
      ...prev,
      [index]: { loaded: true, error: false }
    }));
  }, []);

  const handleImageError = useCallback((index: number) => {
    setImageStatuses(prev => ({
      ...prev,
      [index]: { loaded: false, error: true }
    }));
  }, []);

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <>
      {/* Grid Gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((url, index) => {
          const status = imageStatuses[index];
          const hasError = status?.error;

          return (
            <div
              key={index}
              onClick={() => openLightbox(index)}
              className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden bg-gray-100 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openLightbox(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
            >
              {hasError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                  <ImageOff className="w-8 h-8 mb-2" aria-hidden="true" />
                  <span className="text-xs text-center">Failed to load</span>
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Defect image ${index + 1}`}
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  loading="lazy"
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                />
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />

              {/* Image number badge */}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {index + 1}
              </div>

              {/* Delete button */}
              {allowDelete && onDelete && (
                <button
                  onClick={(e) => handleDelete(e, index)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full
                           opacity-0 group-hover:opacity-100 focus:opacity-100
                           transition-opacity flex items-center justify-center hover:bg-red-600
                           focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label={`Delete image ${index + 1}`}
                  title="Delete image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={images}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNext={goToNext}
        onPrev={goToPrevious}
        onGoTo={goToImage}
      />
    </>
  );
}
