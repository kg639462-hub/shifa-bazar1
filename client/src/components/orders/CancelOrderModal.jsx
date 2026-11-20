import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { cancelOrder } from '../../api/orders';

export default function CancelOrderModal({ order, isOpen, onClose, onOrderCancelled }) {
  const [reason, setReason] = useState('Change of botanical regimen / Alternative tincture needed');
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const reasonsList = [
    'Change of botanical regimen / Alternative tincture needed',
    'Prescribed dosage consultation required before proceeding',
    'Accidental duplicate order entered into dispensary',
    'Delivery address or scheduling adjustment',
    'Other clinical inquiry',
  ];

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fullReason = customNote ? `${reason}: ${customNote}` : reason;

    try {
      const response = await cancelOrder(order.id, fullReason);
      if (response.success) {
        onOrderCancelled(response.order);
        onClose();
      } else {
        setError(response.message || 'Could not cancel order.');
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      setError(err.message || 'Failed to cancel order before shipping.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Rectangular Modal */}
      <div className="bg-white rounded-lg max-w-md w-full border border-red-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-red-50/80 px-6 py-4 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-serif font-bold text-base">Cancel Order Before Dispatch</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCancelSubmit} className="p-6 space-y-4">
          <p className="text-xs text-[#4b6356] leading-relaxed">
            Order <strong className="text-[#0a2e1e] font-mono">{order.id}</strong> is currently in{' '}
            <span className="font-bold text-amber-700 uppercase">{order.order_status}</span> status.
            Because it has not yet departed the dispensary, you may cancel it now to halt batch preparation.
          </p>

          {order.payment_method === 'razorpay' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-950 flex items-start gap-2">
              <span className="text-base">💳</span>
              <div className="leading-tight">
                <strong className="block font-bold text-amber-900">Prepaid Online Order Refund</strong>
                <span className="text-[11px] text-amber-800">
                  Because you paid online (Razorpay), our dispensary admin will directly refund ₹{Number(order.total_amount || 0).toFixed(2)} to your original payment method upon cancellation.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0a2e1e] mb-1.5">
              Reason for Cancellation *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#f0faf4] border border-[#d6e8dd] rounded-md px-3 py-2 text-xs text-[#0a2e1e] focus:outline-emerald-800"
            >
              {reasonsList.map((r, i) => (
                <option key={i} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2e1e] mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Provide any feedback for the herbalist..."
              className="w-full bg-[#f0faf4] border border-[#d6e8dd] rounded-md px-3 py-2 text-xs text-[#0a2e1e] focus:outline-emerald-800"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-md border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Cancellation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
