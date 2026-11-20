import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShieldCheck, CreditCard, Banknote, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createRazorpayOrder, verifyRazorpayPayment, processCodOrder } from '../../api/payment';

export default function CheckoutModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { cartItems, totalInvestment, subtotal, shippingFee, taxAmount, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'cod'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderCompleted, setOrderCompleted] = useState(null);

  // Shipping form state (no hardcoded demo credentials)
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });

  if (!isOpen) return null;

  const formattedTotal = Number(totalInvestment).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleInputChange = (e) => {
    setShippingAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isAuthenticated) {
      setErrorMessage('Please sign in or register to record your prescription order with the dispensary.');
      return;
    }

    setLoading(true);

    const orderPayload = {
      items: cartItems.map((item) => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        images: item.images,
      })),
      totalAmount: totalInvestment,
      subtotal,
      shippingFee,
      taxAmount,
      shippingAddress,
    };

    try {
      if (paymentMethod === 'cod') {
        // Cash on Delivery Flow
        const res = await processCodOrder(orderPayload);
        if (res.success) {
          clearCart();
          setOrderCompleted(res.order);
        } else {
          setErrorMessage(res.message || 'Failed to place COD order.');
        }
      } else {
        // Actual Razorpay Payment Flow in INR (₹)
        const rzpOrder = await createRazorpayOrder(totalInvestment, 'INR');

        if (!window.Razorpay) {
          throw new Error('Razorpay payment gateway is loading. Please check your internet connection or choose Cash on Delivery.');
        }

        const keyId = rzpOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_U1XmP47YTdHQjW';
        const subunitAmount = rzpOrder.amount || Math.round(Number(totalInvestment) * 100);

        const options = {
          key: keyId,
          amount: subunitAmount,
          currency: 'INR',
          name: 'Ash-Shifa Herbals',
          description: 'Botanical Pharmacopeia Dispensary Order',
          image: '/originallogo.png',
          order_id: rzpOrder.orderId || undefined,
          handler: async function (response) {
            try {
              setLoading(true);
              const verifyRes = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id || rzpOrder.orderId || `order_${Date.now()}`,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature || 'verified',
                orderDetails: orderPayload,
              });

              if (verifyRes.success) {
                clearCart();
                setOrderCompleted(verifyRes.order);
              } else {
                setErrorMessage(verifyRes.message || 'Payment verification could not be confirmed.');
              }
            } catch (err) {
              setErrorMessage(err.message || 'Payment verification issue occurred.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: shippingAddress.fullName,
            email: user?.email || 'patient@ashshifa.in',
            contact: shippingAddress.phone,
          },
          theme: {
            color: '#0a2e1e',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.on('payment.failed', function (resp) {
          setErrorMessage(`Payment declined: ${resp.error?.description || 'Transaction cancelled'}`);
          setLoading(false);
        });
        rzpInstance.open();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Error processing transaction.');
    } finally {
      if (paymentMethod === 'cod') {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Rectangular Modal Container */}
      <div className="relative bg-white w-full max-w-xl rounded-lg shadow-2xl border border-[#d6e8dd] overflow-hidden my-8">
        {/* Top Header */}
        <div className="bg-[#f0faf4] px-6 py-4 border-b border-[#e2ece5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <h2 className="font-serif text-lg font-bold text-[#0a2e1e]">
              {orderCompleted ? 'Prescription Dispensed' : 'Clinical Checkout & Settlement'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderCompleted ? (
          /* Rectangular Success Screen */
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="font-serif text-2xl font-bold text-[#0a2e1e]">
              Order Successfully Placed!
            </h3>

            <p className="text-sm text-[#4b6356] max-w-md mx-auto">
              Your herbal preparations have been registered under Reference{' '}
              <strong className="text-[#0a2e1e] font-mono">{orderCompleted.id}</strong>.
              Apothecary cold-pack preparation will commence shortly.
            </p>

            <div className="bg-[#f0faf4] border border-[#d6e8dd] rounded-md p-4 text-left text-xs space-y-1.5 max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-[#4b6356]">Payment Method:</span>
                <span className="font-semibold text-[#0a2e1e] uppercase">
                  {orderCompleted.payment_method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4b6356]">Status:</span>
                <span className="font-semibold text-emerald-800 capitalize">
                  {orderCompleted.order_status} (Cancellable before shipping)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4b6356]">Total Amount:</span>
                <span className="font-sans font-bold text-[#0a2e1e]">
                  ₹{Number(orderCompleted.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  onClose();
                  navigate('/orders');
                }}
                className="flex-1 bg-[#0a2e1e] hover:bg-[#072417] text-white py-3 px-4 rounded-md font-bold text-sm transition-all"
              >
                Track & Manage Orders
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate('/');
                }}
                className="flex-1 border border-[#0a2e1e] text-[#0a2e1e] hover:bg-[#f0faf4] py-3 px-4 rounded-md font-bold text-sm transition-all"
              >
                Return to Compendium
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleCheckoutSubmit} className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Authentication Notice if not signed in */}
            {!isAuthenticated && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Please sign in or register to record your prescription order with your patient profile.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/signin');
                    }}
                    className="px-3 py-1 bg-[#0a2e1e] text-white rounded-md font-semibold hover:bg-[#072417] text-xs"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/register');
                    }}
                    className="px-3 py-1 bg-white border border-[#d6e8dd] text-[#0a2e1e] rounded-md font-semibold hover:bg-gray-50 text-xs"
                  >
                    Register
                  </button>
                </div>
              </div>
            )}

            {/* Section 1: Patient Shipping Address */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                1. Patient Delivery Information (India)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[#4b6356] mb-1 font-medium">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={shippingAddress.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="w-full bg-[#f0faf4] border border-[#d6e8dd] rounded-md px-3 py-2 text-[#0a2e1e] focus:outline-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-[#4b6356] mb-1 font-medium">Mobile Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={shippingAddress.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    className="w-full bg-[#f0faf4] border border-[#d6e8dd] rounded-md px-3 py-2 text-[#0a2e1e] focus:outline-emerald-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[#4b6356] mb-1 font-medium">Street Address / House No. *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={shippingAddress.address}
                    onChange={handleInputChange}
                    placeholder="Enter delivery address"
                    className="w-full bg-[#f0faf4] border border-[#d6e8dd] rounded-md px-3 py-2 text-[#0a2e1e] focus:outline-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-[#4b6356] mb-1 font-medium">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={shippingAddress.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="w-full bg-[#f0faf4] border border-[#d6e8dd] rounded-md px-3 py-2 text-[#0a2e1e] focus:outline-emerald-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#4b6356] mb-1 font-medium">State *</label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      className="w-full bg-[#f0faf4] border border-[#d6e8dd] rounded-md px-3 py-2 text-[#0a2e1e] focus:outline-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[#4b6356] mb-1 font-medium">PIN Code *</label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      value={shippingAddress.postalCode}
                      onChange={handleInputChange}
                      placeholder="6-digit PIN"
                      className="w-full bg-[#f0faf4] border border-[#d6e8dd] rounded-md px-3 py-2 text-[#0a2e1e] focus:outline-emerald-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Rectangular Payment Method Selection */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                2. Select Payment Method
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Razorpay Option */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-md border cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-[#0a2e1e] bg-[#f0faf4] ring-1 ring-[#0a2e1e]'
                      : 'border-[#d6e8dd] hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 text-[#0a2e1e] focus:ring-emerald-800"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0a2e1e]">
                      <CreditCard className="w-4 h-4 text-emerald-800" />
                      Razorpay (UPI / Cards / NetBanking)
                    </div>
                    <p className="text-[11px] text-[#4b6356] mt-0.5">
                      Instant secure payment in Indian Rupees (₹). Supports Google Pay, PhonePe, Paytm & cards.
                    </p>
                  </div>
                </label>

                {/* Cash on Delivery Option */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-md border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#0a2e1e] bg-[#f0faf4] ring-1 ring-[#0a2e1e]'
                      : 'border-[#d6e8dd] hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-[#0a2e1e] focus:ring-emerald-800"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0a2e1e]">
                      <Banknote className="w-4 h-4 text-emerald-800" />
                      Cash on Delivery (COD)
                    </div>
                    <p className="text-[11px] text-[#4b6356] mt-0.5">
                      Pay ₹{formattedTotal} in cash or UPI at the time of doorstep delivery.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Total Summary Footer */}
            <div className="pt-2 border-t border-[#f0f5f2] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#4b6356]">Total Due (INR):</span>
                <span className="font-sans text-xl font-bold text-[#0a2e1e] block tracking-tight">
                  ₹{formattedTotal}
                </span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#0a2e1e] hover:bg-[#072417] text-white py-3 px-6 rounded-md font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {paymentMethod === 'razorpay' ? `Pay ₹${formattedTotal} via Razorpay` : 'Confirm COD Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
