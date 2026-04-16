import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface GalleryModalProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

type SlideDirection = 'left' | 'right';

export function GalleryModal({ images, initialIndex = 0, onClose }: GalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [slideDirection, setSlideDirection] = useState<SlideDirection | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (isAnimating) return;
    setSlideDirection('right');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setIsAnimating(false);
    }, 200);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setSlideDirection('left');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      setIsAnimating(false);
    }, 200);
  };

  const goToImage = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setSlideDirection(index > currentIndex ? 'right' : 'left');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 200);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-[90vh] w-[90%] max-w-[1200px] flex-col items-center justify-center md:h-[95vh] md:w-[95%]">
        <button
          className="absolute right-0 top-[-50px] z-[2001] flex items-center justify-center bg-transparent p-2 text-white transition hover:opacity-80 md:right-2 md:top-2"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={28} />
        </button>

        <div className="relative mb-20 flex h-full w-full items-center justify-center gap-6 md:mb-24">
          <button
            className="absolute left-0 top-1/2 z-[100] flex -translate-y-1/2 items-center justify-center rounded-lg bg-white/20 p-3 text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50 md:p-2"
            onClick={handlePrev}
            disabled={isAnimating}
            aria-label="Previous image"
          >
            <ChevronLeft size={40} className="md:h-7 md:w-7" />
          </button>

          <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
            <img
              key={currentIndex}
              src={images[currentIndex]}
              alt={`Gallery image ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
              style={{
                animation:
                  slideDirection === 'right'
                    ? 'gallerySlideRight 0.2s ease-out forwards'
                    : slideDirection === 'left'
                      ? 'gallerySlideLeft 0.2s ease-out forwards'
                      : undefined,
              }}
            />
          </div>

          <button
            className="absolute right-0 top-1/2 z-[100] flex -translate-y-1/2 items-center justify-center rounded-lg bg-white/20 p-3 text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50 md:p-2"
            onClick={handleNext}
            disabled={isAnimating}
            aria-label="Next image"
          >
            <ChevronRight size={40} className="md:h-7 md:w-7" />
          </button>
        </div>

        <div className="absolute bottom-0 left-1/2 w-full -translate-x-1/2 rounded-t-lg bg-black/40 p-5">
          <div className="gallery-thumbnails flex max-w-full justify-center gap-3 overflow-x-auto py-2 md:gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                className={cn(
                  'h-20 w-20 shrink-0 overflow-hidden rounded border-2 bg-transparent p-0 opacity-60 transition hover:opacity-80 disabled:cursor-not-allowed',
                  index === currentIndex ? 'border-white opacity-100' : 'border-transparent',
                  'md:h-[60px] md:w-[60px]',
                )}
                onClick={() => goToImage(index)}
                aria-label={`Go to image ${index + 1}`}
                disabled={isAnimating}
              >
                <img src={image} alt={`Thumbnail ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-5 right-5 rounded bg-black/50 px-3 py-2 text-sm font-medium text-white">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
