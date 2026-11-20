import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const primaryImage =
    (product.images && product.images[0]) ||
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80';

  // Calculate prices and discount
  const sellingPrice = Number(product.price) || 0;
  const originalPrice =
    product.original_price && Number(product.original_price) > sellingPrice
      ? Number(product.original_price)
      : Math.round(sellingPrice * 1.25);

  const discountPercent =
    product.discount_percent !== undefined && product.discount_percent !== null
      ? Number(product.discount_percent)
      : originalPrice > sellingPrice
      ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
      : 0;

  // Format prices in Indian Rupees (₹)
  const formattedPrice = sellingPrice.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedOriginalPrice = originalPrice.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="group bg-white rounded-2xl border border-[#d6e8dd] p-3 sm:p-3.5 hover:border-[#0a2e1e]/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      {/* Normal Proportional Image Box */}
      <Link
        to={`/product/${product.id}`}
        className="relative block w-full h-48 sm:h-52 md:h-56 rounded-xl overflow-hidden bg-[#f4faf6]"
      >
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Subtle Extract Type / Batch Badge */}
        {product.batch_lot && (
          <span className="absolute top-2.5 left-2.5 bg-white/95 text-[10px] font-mono font-bold tracking-wider text-[#0a2e1e] px-2 py-0.5 rounded-sm border border-[#d6e8dd] shadow-2xs">
            {product.batch_lot}
          </span>
        )}

        {/* Eye-Catching Red Discount Badge on Top Right */}
        {discountPercent > 0 && (
          <span className="absolute top-2.5 right-2.5 bg-[#e11d48] text-white text-[10px] font-sans font-bold tracking-wider uppercase px-2 py-0.5 rounded-sm shadow-xs">
            {discountPercent}% OFF
          </span>
        )}
      </Link>

      {/* Card Body: Normal balanced spacing */}
      <div className="pt-3 px-1 flex flex-col justify-between flex-grow space-y-2">
        <div>
          <Link to={`/product/${product.id}`} className="block group-hover:text-emerald-950 transition-colors">
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#0a2e1e] leading-snug line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {product.scientific_name && (
            <p className="font-serif italic text-xs text-[#4b6356] line-clamp-1 mt-0.5">
              {product.scientific_name}
            </p>
          )}
        </div>

        {/* Footer: Price in Rupees (₹) with Discount & Circular Dark Green Plus Button */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#f0f5f2]">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 flex-wrap">
              {/* Selling Price */}
              <div className="font-sans text-lg sm:text-xl font-bold text-[#0a2e1e] tracking-tight flex items-baseline">
                <span className="mr-0.5 text-base font-semibold">₹</span>
                <span>{formattedPrice}</span>
              </div>

              {/* Strikethrough Original MRP */}
              {originalPrice > sellingPrice && (
                <span className="font-sans text-xs sm:text-sm text-gray-400 line-through">
                  ₹{formattedOriginalPrice}
                </span>
              )}
            </div>

            {/* Savings Callout */}
            {discountPercent > 0 && (
              <span className="text-[11px] font-semibold text-emerald-700">
                Save {discountPercent}% today
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs shrink-0 active:scale-90 ${
              added
                ? 'bg-emerald-700 text-white'
                : 'bg-[#0a2e1e] hover:bg-[#072417] text-white'
            }`}
            title={`Add ${product.name} to cart`}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Plus className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
