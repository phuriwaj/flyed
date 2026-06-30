import { useState } from 'react';

interface Props {
  images: { src: string; alt: string }[];
}

export default function ImageCarousel({ images }: Props) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  return (
    <div className="relative bg-rice-100 rounded-lg overflow-hidden">
      <div className="aspect-[16/9]">
        <img src={images[idx].src} alt={images[idx].alt} className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-rice-50/90 hover:bg-rice-50 text-teak-900 w-10 h-10 rounded-full flex items-center justify-center"
          >
            ←
          </button>
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-rice-50/90 hover:bg-rice-50 text-teak-900 w-10 h-10 rounded-full flex items-center justify-center"
          >
            →
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === idx}
                className={`w-2 h-2 rounded-full transition ${i === idx ? 'bg-rice-50' : 'bg-rice-50/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
