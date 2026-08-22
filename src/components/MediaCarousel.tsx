
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  position: number;
}

interface MediaCarouselProps {
  media: MediaItem[];
}

const MediaCarousel = ({ media }: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  // Sort media by position
  const sortedMedia = [...media].sort((a, b) => a.position - b.position);
  const currentItem = sortedMedia[currentIndex];

  const nextItem = () => {
    setCurrentIndex(prev => (prev + 1) % sortedMedia.length);
  };

  const prevItem = () => {
    setCurrentIndex(prev => (prev - 1 + sortedMedia.length) % sortedMedia.length);
  };

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {currentItem.type === 'image' ? (
          <img
            src={currentItem.url}
            alt="Post content"
            className="w-full max-h-96 object-cover"
            loading="lazy"
          />
        ) : (
          <video
            src={currentItem.url}
            className="w-full max-h-96 object-cover"
            controls
            preload="metadata"
            playsInline
          />
        )}
        
        {/* Navigation arrows - only show if multiple items */}
        {sortedMedia.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70"
              onClick={prevItem}
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70"
              onClick={nextItem}
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </Button>
          </>
        )}
      </div>

      {/* Dots indicator - only show if multiple items */}
      {sortedMedia.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {sortedMedia.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
