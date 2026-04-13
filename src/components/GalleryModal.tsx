import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './GalleryModal.css';

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
    const direction = index > currentIndex ? 'right' : 'left';
    setSlideDirection(direction);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 200);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnimating]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={28} />
        </button>

        <div className="modal-main-container">
          <button
            className="modal-chevron modal-chevron-left"
            onClick={handlePrev}
            disabled={isAnimating}
            aria-label="Previous image"
          >
            <ChevronLeft size={40} />
          </button>

          <div className="modal-main-image-wrapper">
            <img
              key={currentIndex}
              src={images[currentIndex]}
              alt={`Gallery image ${currentIndex + 1}`}
              className={`modal-main-image ${
                slideDirection === 'right'
                  ? 'slide-in-from-right'
                  : slideDirection === 'left'
                    ? 'slide-in-from-left'
                    : ''
              }`}
            />
          </div>

          <button
            className="modal-chevron modal-chevron-right"
            onClick={handleNext}
            disabled={isAnimating}
            aria-label="Next image"
          >
            <ChevronRight size={40} />
          </button>
        </div>

        <div className="modal-thumbnails-container">
          <div className="modal-thumbnails">
            {images.map((image, index) => (
              <button
                key={index}
                className={`modal-thumbnail ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToImage(index)}
                aria-label={`Go to image ${index + 1}`}
                disabled={isAnimating}
              >
                <img src={image} alt={`Thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="modal-counter">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
