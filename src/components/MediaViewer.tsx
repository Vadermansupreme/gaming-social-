import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MediaViewerProps {
  media: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const MediaViewer = ({ media, initialIndex, isOpen, onClose }: MediaViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + media.length) % media.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % media.length);
  };

  const isVideo = (url: string) => {
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none [&>button]:hidden" 
        aria-describedby="media-viewer-description"
      >
        <DialogTitle className="sr-only">Media Viewer</DialogTitle>
        <div id="media-viewer-description" className="sr-only">View and navigate through media content</div>
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Single close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Navigation buttons */}
          {media.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 text-white hover:bg-white/20"
                onClick={goToPrevious}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 text-white hover:bg-white/20"
                onClick={goToNext}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          {/* Media content */}
          <div className="w-full h-full flex items-center justify-center p-4">
            {isVideo(media[currentIndex]) ? (
              <video
                src={media[currentIndex]}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={media[currentIndex]}
                alt="Enlarged view"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Dots indicator */}
          {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {media.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewer;