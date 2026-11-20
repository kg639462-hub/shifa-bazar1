import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartItem from '../components/cart/CartItem';
import DispensarySummary from '../components/cart/DispensarySummary';
import CheckoutModal from '../components/checkout/CheckoutModal';

export default function CartPage() {
  const { cartItems, itemCount } = useCart();
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-[#4b6356]">
        <Link to="/" className="hover:text-[#0a2e1e]">Home</Link>
        <span>&gt;</span>
        <span className="text-[#4b6356]">Dispensary</span>
        <span>&gt;</span>
        <span className="text-[#0a2e1e] flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
          Prescription Cart
        </span>
      </div>

      {/* Main Title & Batch Verified Badge (Rectangular) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0a2e1e]">
            Your Preparations
          </h1>
          <p className="text-xs sm:text-sm font-medium text-emerald-800 flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
            {itemCount} Herbal {itemCount === 1 ? 'Preparation' : 'Preparations'} in Cart
          </p>
        </div>

        <span className="bg-[#dcfce7] text-[#0a2e1e] text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase px-3 py-1 rounded-sm border border-[#bbf7d0]">
          BATCH VERIFIED
        </span>
      </div>

      {/* Empty State (Rectangular) */}
      {cartItems.length === 0 ? (
        <div className="bg-white rounded-lg p-10 sm:p-14 border border-[#d6e8dd] text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-md bg-[#f0faf4] text-emerald-800 flex items-center justify-center mx-auto border border-[#d6e8dd]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#0a2e1e]">
            Your Dispensary Cart is Empty
          </h3>
          <p className="text-xs sm:text-sm text-[#4b6356] max-w-sm mx-auto">
            Explore the Botanical Compendium to select verified extracts, capsules, and herbal remedies.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#0a2e1e] text-white px-5 py-2.5 rounded-md text-xs font-bold hover:bg-[#072417] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse Compendium
            </Link>
          </div>
        </div>
      ) : (
        /* Cart Items List & Dispensary Summary */
        <div className="space-y-6">
          {/* List of rectangular items */}
          <div className="space-y-3.5">
            {cartItems.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          {/* Dispensary Summary Section */}
          <DispensarySummary
            onProceedToCheckout={() => setCheckoutModalOpen(true)}
          />
        </div>
      )}

      {/* Clinical Checkout Modal (Razorpay in ₹ + COD in ₹) */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
      />
    </div>
  );
}
