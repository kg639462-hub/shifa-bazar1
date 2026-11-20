import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

/**
 * STRICT REQUIREMENT IMPLEMENTATION:
 * Product gallery strictly displaying exactly 4 images for every product.
 * Redesigned with rectangular aspect ratio and crisp rectangular cards.
 */
export default function ProductGallery({ images = [], productName = 'Botanical Formulation' }) {
  const defaultFallbacks = [
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&w=800&q=80',
  ];

  // Strictly enforce 4 images
  let strictlyFourImages = Array.isArray(images) ? [...images] : [];
  if (strictlyFourImages.length > 4) {
    strictlyFourImages = strictlyFourImages.slice(0, 4);
  }
  while (strictlyFourImages.length < 4) {
    strictlyFourImages.push(defaultFallbacks[strictlyFourImages.length]);
  }

  const [activeIndex, setActiveIndex] = useState(0);

  const imageDescriptions = [
    'View 1: Primary Apothecary Packaging & Extraction',
    'View 2: Bioactive Harvest & Raw Botanicals',
    'View 3: Dispensing Dropper & Viscosity Monograph',
    'View 4: Laboratory Verified Batch Seal & Specifications',
  ];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? 3 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === 3 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Rectangular Main Viewport Card */}
      <div className="relative aspect-[16/10] sm:aspect-[4/3] rounded-lg overflow-hidden bg-white border border-[#d6e8dd] shadow-sm flex items-center justify-center group">
        <img
          src={strictlyFourImages[activeIndex]}
          alt={`${productName} - View ${activeIndex + 1} of 4`}
          className="w-full h-full object-cover object-center transition-all duration-300"
        />

        {/* Gallery navigation controls */}
        <button
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-white/95 hover:bg-white text-[#0a2e1e] shadow-sm flex items-center justify-center border border-[#d6e8dd] opacity-80 group-hover:opacity-100 transition-opacity"
          aria-label="Previous gallery image"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-white/95 hover:bg-white text-[#0a2e1e] shadow-sm flex items-center justify-center border border-[#d6e8dd] opacity-80 group-hover:opacity-100 transition-opacity"
          aria-label="Next gallery image"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Rectangular Active View Overlay */}
        <div className="absolute bottom-2.5 left-2.5 bg-[#0a2e1e]/90 text-white text-[11px] font-medium px-2.5 py-1 rounded-sm flex items-center gap-1.5 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          <span>{imageDescriptions[activeIndex]}</span>
          <span className="text-emerald-300 font-mono">({activeIndex + 1}/4)</span>
        </div>
      </div>

      {/* STRICT 4-THUMBNAIL RECTANGULAR GALLERY GRID */}
      <div className="grid grid-cols-4 gap-2.5">
        {strictlyFourImages.map((imgSrc, idx) => {
          const isSelected = activeIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative aspect-[16/10] rounded-md overflow-hidden border-2 transition-all ${
                isSelected
                  ? 'border-[#0a2e1e] ring-1 ring-[#0a2e1e] shadow-xs'
                  : 'border-[#d6e8dd] opacity-75 hover:opacity-100 hover:border-emerald-700'
              }`}
              aria-label={`View image ${idx + 1} of 4`}
            >
              <img
                src={imgSrc}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-mono px-1 rounded-xs">
                0{idx + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
