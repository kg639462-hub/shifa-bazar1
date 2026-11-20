import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Snowflake, Check, Award, AlertCircle, Edit3, Loader2 } from 'lucide-react';
import { getProductById, updateProductPrice } from '../api/products';
import { useCart } from '../context/CartContext';
import ProductGallery from '../components/product/ProductGallery';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Backend Price Editor State
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [priceUpdateMessage, setPriceUpdateMessage] = useState('');

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        console.error('Failed to load remedy details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#4b6356]">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-800 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm">Retrieving botanical monograph record...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="font-serif text-xl font-bold text-[#0a2e1e]">Remedy Not Found</h2>
        <p className="text-xs text-[#4b6356] mt-1 mb-6">
          The requested botanical preparation could not be located in the compendium.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#0a2e1e] text-white px-4 py-2 rounded-md text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Compendium
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const handleSaveBackendPrice = async (e) => {
    e.preventDefault();
    if (!newPriceInput) return;
    setUpdatingPrice(true);
    setPriceUpdateMessage('');

    try {
      const res = await updateProductPrice(product.id, parseFloat(newPriceInput));
      if (res.success && res.product) {
        setProduct({ ...product, price: Number(res.product.price) });
        setPriceUpdateMessage(res.message);
        setIsEditingPrice(false);
      }
    } catch (err) {
      setPriceUpdateMessage('Error updating price: ' + err.message);
    } finally {
      setUpdatingPrice(false);
    }
  };

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
  const savingsAmount = originalPrice - sellingPrice;

  const formattedPrice = sellingPrice.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedOriginalPrice = originalPrice.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedSavings = savingsAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalCalculated = (sellingPrice * quantity).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Rectangular Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-[#4b6356]">
        <Link to="/" className="hover:text-[#0a2e1e] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Botanical Compendium
        </Link>
        <span>/</span>
        <span className="text-[#0a2e1e] font-semibold">{product.category}</span>
        <span>/</span>
        <span className="text-emerald-900 font-bold truncate">{product.name}</span>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: STRICT 4-IMAGE RECTANGULAR GALLERY (lg:col-span-6) */}
        <div className="lg:col-span-6">
          <ProductGallery images={product.images} productName={product.name} />

          {/* Rectangular Cold-pack Shipping Assurance Card */}
          <div className="mt-4 p-4 rounded-lg bg-white border border-[#d6e8dd] flex items-center gap-3 shadow-xs">
            <Snowflake className="w-5 h-5 text-cyan-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-[#0a2e1e] block">
                Complimentary Apothecary Cold-Pack Delivery Across India
              </span>
              <span className="text-[#4b6356]">
                Guaranteed freshness & bioactive terpene integrity under temperature control.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Details & Purchase Controls (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-6 bg-white p-6 sm:p-8 rounded-lg border border-[#d6e8dd] shadow-xs">
          {/* Header Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#dcfce7] text-[#0a2e1e] text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-sm border border-[#bbf7d0]">
                {product.batch_lot}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                {product.category}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0a2e1e] leading-tight">
              {product.name}
            </h1>

            {product.scientific_name && (
              <p className="font-serif italic text-xs sm:text-sm text-[#4b6356] mt-1">
                {product.scientific_name}
              </p>
            )}

            {/* Price Row in Rupees (₹) with Discount & Backend Price Setter */}
            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap items-baseline gap-3">
                {/* Selling Price */}
                <div className="font-sans text-3xl font-bold text-[#0a2e1e] tracking-tight flex items-baseline">
                  <span className="mr-1 text-2xl font-semibold">₹</span>
                  <span>{formattedPrice}</span>
                </div>

                {/* Strikethrough M.R.P. */}
                {originalPrice > sellingPrice && (
                  <div className="flex items-baseline gap-1 text-sm text-[#4b6356]">
                    <span>M.R.P.:</span>
                    <span className="line-through font-sans">₹{formattedOriginalPrice}</span>
                  </div>
                )}

                {/* Discount Percentage Pill */}
                {discountPercent > 0 && (
                  <span className="bg-[#e11d48] text-white text-xs font-sans font-bold px-2.5 py-0.5 rounded-sm uppercase tracking-wider shadow-2xs">
                    {discountPercent}% OFF
                  </span>
                )}

                <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200 ml-auto">
                  In Stock & Lab Verified ({product.stock} units available)
                </span>
              </div>

              {/* Savings callout & Set Price link */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                {discountPercent > 0 && (
                  <p className="text-emerald-800 font-semibold flex items-center gap-1">
                    <span>🎉</span> You save ₹{formattedSavings} ({discountPercent}% off retail price)
                  </p>
                )}

                {/* Backend Price Trigger Button */}
                <button
                  onClick={() => {
                    setIsEditingPrice(!isEditingPrice);
                    setNewPriceInput(product.price);
                  }}
                  className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 underline underline-offset-2 ml-auto"
                  title="Update remedy price in Supabase via backend"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Set Price (Backend)</span>
                </button>
              </div>
            </div>

            {/* Price Update Form */}
            {isEditingPrice && (
              <form onSubmit={handleSaveBackendPrice} className="mt-3 p-3 bg-[#f0faf4] border border-[#d6e8dd] rounded-md flex items-center gap-2 text-xs">
                <span className="font-bold text-[#0a2e1e]">New Price: ₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newPriceInput}
                  onChange={(e) => setNewPriceInput(e.target.value)}
                  className="w-24 bg-white border border-[#d6e8dd] rounded-sm px-2 py-1 text-[#0a2e1e] font-bold"
                />
                <button
                  type="submit"
                  disabled={updatingPrice}
                  className="bg-[#0a2e1e] text-white px-3 py-1 rounded-sm font-semibold hover:bg-[#072417] flex items-center gap-1 disabled:opacity-50"
                >
                  {updatingPrice && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save via Backend
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPrice(false)}
                  className="text-gray-500 hover:text-gray-700 px-1"
                >
                  Cancel
                </button>
              </form>
            )}

            {priceUpdateMessage && (
              <p className="mt-2 text-xs font-semibold text-emerald-800">
                {priceUpdateMessage}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="prose text-xs sm:text-sm text-[#4b6356] leading-relaxed border-t border-[#f0f5f2] pt-4">
            <p>{product.full_desc || product.short_desc}</p>
          </div>

          {/* Recommended Administration / Dosage - Rectangular container */}
          {product.dosage && (
            <div className="p-4 rounded-md bg-[#f0faf4] border border-[#d6e8dd] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                Clinical Administration & Suggested Dosage
              </span>
              <p className="text-xs text-[#0a2e1e] font-medium leading-relaxed">
                {product.dosage}
              </p>
            </div>
          )}

          {/* Ingredients List */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0a2e1e] block">
                Standardized Bioactive Ingredients
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.ingredients.map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-[#4b6356] bg-[#f9fcf9] p-2.5 rounded-md border border-[#e2ece5]"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{ing}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Add to Cart (Rectangular) */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[#d6e8dd] rounded-md overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#0a2e1e] hover:bg-[#eaf5ee] transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-[#0a2e1e]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-[#0a2e1e] hover:bg-[#eaf5ee] transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Rectangular CTA button */}
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-6 rounded-md font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                  addedSuccess
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#0a2e1e] hover:bg-[#072417] text-white active:scale-[0.99]'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added to Dispensary Cart
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add to Dispensary Cart — ₹{totalCalculated}
                  </>
                )}
              </button>
            </div>

            {/* Link to Cart if added */}
            {addedSuccess && (
              <div className="text-center">
                <Link
                  to="/cart"
                  className="text-xs font-semibold text-emerald-800 underline underline-offset-2"
                >
                  Proceed directly to Prescription Cart →
                </Link>
              </div>
            )}
          </div>

          {/* Laboratory Quality Monograph Certificate */}
          <div className="border-t border-[#e2ece5] pt-4 flex items-center gap-3 text-xs text-[#4b6356]">
            <Award className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Includes official Batch Monograph & Third-Party Lab Certificate of Analysis (COA) for purity, potency, and safety.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
