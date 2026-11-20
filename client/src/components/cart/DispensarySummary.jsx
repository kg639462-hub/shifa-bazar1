import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Snowflake, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function DispensarySummary({ onProceedToCheckout }) {
  const { subtotal, shippingFee, taxAmount, totalInvestment, cartItems } = useCart();

  const formattedSubtotal = Number(subtotal).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedTotal = Number(totalInvestment).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedTax = Number(taxAmount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-4">
      {/* Rectangular Dispensary Summary Box */}
      <div className="bg-white rounded-lg p-6 border border-[#d6e8dd] shadow-xs space-y-4">
        {/* Header with STANDARD RX Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f5f2]">
          <h3 className="font-semibold text-base sm:text-lg text-[#0a2e1e]">
            Dispensary Summary
          </h3>
          <span className="bg-[#dcfce7] text-[#0a2e1e] text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-sm border border-[#bbf7d0]">
            STANDARD RX
          </span>
        </div>

        {/* Breakdown Items */}
        <div className="space-y-2.5 text-xs sm:text-sm text-[#4b6356]">
          <div className="flex justify-between items-center">
            <span>Remedies Subtotal</span>
            <span className="font-semibold text-[#0a2e1e]">
              ₹{formattedSubtotal}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <Snowflake className="w-3.5 h-3.5 text-cyan-600" />
              Apothecary Cold-pack Shipping
            </span>
            <span className="font-bold text-emerald-800">
              {shippingFee === 0 ? 'FREE' : `₹${Number(shippingFee).toFixed(2)}`}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>Estimated Botanical Tax (GST)</span>
            <span className="font-semibold text-[#0a2e1e]">
              ₹{formattedTax}
            </span>
          </div>
        </div>

        {/* Total Investment Row in Rupees */}
        <div className="pt-4 border-t border-[#f0f5f2] flex items-baseline justify-between">
          <div>
            <span className="font-serif text-lg font-bold text-[#0a2e1e] block">
              Total Investment
            </span>
            <span className="text-[11px] text-[#4b6356]">
              Including therapeutic packaging & laboratory cold-pack seal
            </span>
          </div>
          <div className="font-sans text-2xl font-bold text-[#0a2e1e] tracking-tight flex items-baseline">
            <span className="mr-0.5 text-xl font-semibold">₹</span>
            <span>{formattedTotal}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button (Rectangular) */}
      <button
        onClick={onProceedToCheckout}
        disabled={cartItems.length === 0}
        className="w-full bg-[#0a2e1e] hover:bg-[#072417] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 px-6 rounded-md font-bold text-sm sm:text-base flex items-center justify-between shadow-sm transition-all active:scale-[0.99]"
      >
        <span className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-300" />
          Proceed to Clinical Checkout
        </span>
        <span className="font-sans text-base sm:text-lg font-bold tracking-tight">
          ₹{formattedTotal}
        </span>
      </button>

      {/* Continue Browsing Remedies Link */}
      <div className="text-center pt-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a2e1e] hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Continue Browsing Remedies
        </Link>
      </div>
    </div>
  );
}
