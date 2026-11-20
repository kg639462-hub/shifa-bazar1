import React from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  const primaryImage =
    (item.images && item.images[0]) ||
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80';

  const itemTotal = (Number(item.price) * item.quantity).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const unitPrice = Number(item.price).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#d6e8dd] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Rectangular Thumbnail with overlay badge */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="relative w-28 h-20 rounded-md overflow-hidden bg-[#f4faf6] shrink-0 border border-[#d6e8dd]">
          <img
            src={primaryImage}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          {item.extract_type && (
            <span className="absolute top-1 left-1 bg-white/95 text-[9px] font-bold text-[#0a2e1e] px-1.5 py-0.5 rounded-xs shadow-2xs border border-[#d6e8dd]">
              {item.extract_type}
            </span>
          )}
        </div>

        {/* Text information */}
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase block mb-0.5">
            {item.category?.toUpperCase()} • {item.batch_lot}
          </span>
          <h4 className="font-serif text-base sm:text-lg font-bold text-[#0a2e1e] truncate">
            {item.name}
          </h4>
          <p className="text-xs text-[#4b6356] line-clamp-1 mt-0.5">
            {item.short_desc}
          </p>
          <div className="mt-2 font-sans text-base sm:text-lg font-bold text-[#0a2e1e] sm:hidden">
            ₹{itemTotal}
          </div>
        </div>

        {/* Remove button (mobile) */}
        <button
          onClick={() => removeFromCart(item.id)}
          className="sm:hidden text-gray-400 hover:text-gray-600 p-1"
          aria-label="Remove item"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Price, Rectangular Quantity Selector, and Remove */}
      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0f5f2]">
        <div className="hidden sm:block text-right">
          <span className="font-sans text-lg font-bold text-[#0a2e1e]">
            ₹{itemTotal}
          </span>
          {item.quantity > 1 && (
            <span className="block text-[10px] text-[#4b6356]">
              (₹{unitPrice} each)
            </span>
          )}
        </div>

        {/* Rectangular Quantity Controls */}
        <div className="flex items-center border border-[#d6e8dd] rounded-md overflow-hidden bg-white">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="w-8 h-8 flex items-center justify-center text-[#0a2e1e] hover:bg-[#eaf5ee] transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-xs font-bold text-[#0a2e1e]">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center text-[#0a2e1e] hover:bg-[#eaf5ee] transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Remove button (desktop) */}
        <button
          onClick={() => removeFromCart(item.id)}
          className="hidden sm:block text-gray-400 hover:text-gray-700 transition-colors p-1"
          aria-label="Remove item"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
