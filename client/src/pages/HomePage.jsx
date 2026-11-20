import React, { useEffect, useState } from 'react';
import { Leaf, Sparkles, ShieldCheck } from 'lucide-react';
import { getProducts } from '../api/products';
import ProductCard from '../components/catalog/ProductCard';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDispensaryProducts() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDispensaryProducts();
  }, []);

  return (
    <div className="w-full max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Botanical Compendium Hero Header */}
      <div className="space-y-4">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#0a2e1e] uppercase">
              YOUR HEALTHCARE DESTINATION
            </span>
            <span className="bg-[#dcfce7] text-[#0a2e1e] text-[10px] font-mono font-bold tracking-wider px-3 py-1 rounded-sm uppercase border border-[#c6f6d5]">
              Quality Care Everyday
            </span>
          </div>
        </div>

        {/* Compendium Title */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#0a2e1e] tracking-tight">
          Your Health Our Priority
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-[#4b6356] max-w-3xl leading-relaxed">
          Shop genuine medicines and healthcare essentials online. Get the healthcare products you need, delivered conveniently to your doorstep.
        </p>

        {/* Potency Banner Pill */}
        <div className="inline-flex items-center gap-2 bg-[#dcfce7]/70 border border-[#bbf7d0] px-4 py-2 rounded-md text-xs sm:text-sm font-semibold text-[#0a2e1e] shadow-2xs">
          <Leaf className="w-4 h-4 text-emerald-700" />
          <span>Trusted Medicines • Easy Shoping • Better Healthcare</span>
        </div>
      </div>

      {/* Product Catalog Grid: Exactly 3 products per row on desktop, normal box size */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-4 border border-[#e2ece5] animate-pulse space-y-3">
              <div className="w-full h-48 sm:h-52 md:h-56 bg-gray-200 rounded-xl"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3 pt-2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Dispensary Certification Banner (Rectangular) */}
      <div className="bg-white rounded-lg p-6 sm:p-8 border border-[#d6e8dd] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Prescription Pharmacopeia Standards</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0a2e1e]">
            Handcrafted with Active Botanical Integrity
          </h2>
          <p className="text-xs sm:text-sm text-[#4b6356] max-w-xl">
            All formulations are standardized to bioactive marker compounds, sealed in amber miron glass, and kept cold until clinical courier dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-[#f0faf4] border border-[#d6e8dd] rounded-md px-4 py-3 text-center">
            <ShieldCheck className="w-6 h-6 text-emerald-700 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-[#0a2e1e] block">100% Monograph</span>
            <span className="text-[9px] text-[#4b6356]">Lab Verified</span>
          </div>
          <div className="bg-[#f0faf4] border border-[#d6e8dd] rounded-md px-4 py-3 text-center">
            <Leaf className="w-6 h-6 text-emerald-700 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-[#0a2e1e] block">Cold-Pack</span>
            <span className="text-[9px] text-[#4b6356]">Free Shipping</span>
          </div>
        </div>
      </div>
    </div>
  );
}
