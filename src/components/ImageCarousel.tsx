import { useState } from 'react';

interface Props {
  images: { src: string; alt: string }[];
}

export default function ImageCarousel({ images }: Props) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  const controlBtn =
    'absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full inline-flex items-center justify-center bg-chip-translucent hover:bg-ink text-canvas active:scale-[0.95] transition-colors duration-150';

  return (
    <div className="relative bg-canvas-parchment rounded-lg overflow-hidden">
      <div className="aspect-[16/9]">
        <img src={images[idx].src} alt={images[idx].alt} className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <>
          <button onClick={prev} aria-label="Previous image" className={`left-3 ${controlBtn}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M9 2.5 4.5 7 9 11.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button onClick={next} aria-label="Next image" className={`right-3 ${controlBtn}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M5 2.5 9.5 7 5 11.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === idx}
                className={`w-2 h-2 rounded-full transition-colors duration-150 ${i === idx ? 'bg-canvas' : 'bg-canvas/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
