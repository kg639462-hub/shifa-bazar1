import React, { useState } from 'react';
import { Package, Truck, CheckCircle2, XCircle, Clock, Calendar, AlertCircle, Navigation, RefreshCw } from 'lucide-react';
import CancelOrderModal from './CancelOrderModal';

export default function OrderCard({ order, onUpdateOrder }) {
  const [showCancelModal, setShowCancelModal] = useState(false);

  const cleanStatus = (order.order_status || 'confirmed').toLowerCase().replace(/\s+/g, '_');
  const isCancelled = cleanStatus === 'cancelled';
  const isCancellable = ['pending', 'confirmed', 'processing'].includes(cleanStatus);
  const isShipped = ['shipped', 'out_for_delivery', 'delivered'].includes(cleanStatus);

  const isPrepaid =
    order.payment_method === 'razorpay' ||
    ['paid', 'refunded'].includes((order.payment_status || '').toLowerCase());

  const isRefundCompleted =
    (order.payment_status || '').toLowerCase() === 'refunded' ||
    (order.refund_status || '').toLowerCase() === 'completed' ||
    Boolean(order.refund_transaction_ref) ||
    Boolean(order.refund_processed_at) ||
    (typeof order.cancellation_reason === 'string' &&
      (order.cancellation_reason.includes('[REFUND_COMPLETED') ||
        order.cancellation_reason.includes('[REFUND_REF:')));

  const extractedRef =
    order.refund_transaction_ref ||
    (typeof order.cancellation_reason === 'string' &&
      order.cancellation_reason.match(/Ref\s+([^,]+)/i)?.[1]?.trim()) ||
    'RZP-REFUND-COMPLETED';

  // Clean cancellation reason without technical tags
  const displayReason = (order.cancellation_reason || '')
    .replace(/\[REFUND_.+?\]/gs, '')
    .replace(/\[STAGE:.+?\]/gs, '')
    .trim();

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'out_for_delivery':
      case 'out of delivery':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formattedTotal = Number(order.total_amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleCancelled = (updatedOrder) => {
    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }
  };

  return (
    <div className="bg-white rounded-lg p-5 sm:p-6 border border-[#d6e8dd] shadow-xs space-y-4">
      {/* Top Bar: Order ID, Date, and Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f0f5f2]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#0a2e1e]">
              #{order.id}
            </span>
            <span
              className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-sm border ${getStatusBadge(
                order.order_status
              )}`}
            >
              {(order.order_status || '').replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#4b6356] mt-0.5">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(order.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-[#4b6356]">Total Investment</span>
          <p className="font-sans text-lg font-bold text-[#0a2e1e]">
            ₹{formattedTotal}
          </p>
        </div>
      </div>

      {/* Progress Timeline Stepper (Rectangular 5-stage) */}
      {!isCancelled && (
        <div className="py-2">
          <div className="grid grid-cols-5 text-[9px] sm:text-[10px] font-semibold text-[#4b6356] text-center gap-1">
            <span className="text-[#0a2e1e] flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Placed</span>
            </span>
            <span
              className={`flex items-center justify-center gap-1 ${
                ['processing', 'shipped', 'out_for_delivery', 'delivered'].includes(cleanStatus)
                  ? 'text-[#0a2e1e] font-bold'
                  : 'text-gray-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Prep</span>
            </span>
            <span
              className={`flex items-center justify-center gap-1 ${
                ['shipped', 'out_for_delivery', 'delivered'].includes(cleanStatus)
                  ? 'text-[#0a2e1e] font-bold'
                  : 'text-gray-400'
              }`}
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Shipped</span>
            </span>
            <span
              className={`flex items-center justify-center gap-1 ${
                ['out_for_delivery', 'delivered'].includes(cleanStatus)
                  ? 'text-[#0a2e1e] font-bold'
                  : 'text-gray-400'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Out for Del.</span>
            </span>
            <span
              className={`flex items-center justify-center gap-1 ${
                cleanStatus === 'delivered' ? 'text-emerald-700 font-bold' : 'text-gray-400'
              }`}
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Delivered</span>
            </span>
          </div>
          <div className="w-full bg-[#e2ece5] h-1.5 rounded-xs mt-2 overflow-hidden">
            <div
              className="bg-emerald-700 h-full transition-all duration-500 rounded-xs"
              style={{
                width:
                  cleanStatus === 'confirmed' || cleanStatus === 'pending'
                    ? '20%'
                    : cleanStatus === 'processing'
                    ? '40%'
                    : cleanStatus === 'shipped'
                    ? '60%'
                    : cleanStatus === 'out_for_delivery' || cleanStatus === 'out of delivery'
                    ? '80%'
                    : cleanStatus === 'delivered'
                    ? '100%'
                    : '20%',
              }}
            />
          </div>
        </div>
      )}

      {/* Rectangular Order Items List */}
      <div className="space-y-3 pt-1">
        {order.items?.map((item, idx) => {
          const itemUnit = Number(item.unit_price || item.price).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const itemTotal = ((item.unit_price || item.price) * item.quantity).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return (
            <div key={idx} className="flex items-center gap-3">
              {/* Rectangular Thumbnail */}
              <div className="w-16 h-12 rounded-sm overflow-hidden bg-[#f0faf4] border border-[#e2ece5] shrink-0">
                <img
                  src={
                    item.product_image ||
                    (item.images && item.images[0]) ||
                    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={item.product_name || item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-serif text-xs sm:text-sm font-semibold text-[#0a2e1e] truncate">
                  {item.product_name || item.name}
                </h5>
                <p className="text-[11px] text-[#4b6356]">
                  Qty: {item.quantity} × ₹{itemUnit}
                </p>
              </div>
              <span className="font-sans text-xs sm:text-sm font-semibold text-[#0a2e1e]">
                ₹{itemTotal}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cancellation Notice & Refund Workflow */}
      {isCancelled && (
        <div className="space-y-3">
          <div className="p-3 bg-red-50/70 border border-red-200 rounded-md text-xs text-red-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>Cancelled Before Shipping</span>
            </div>
            {displayReason && (
              <p className="text-[11px] text-red-700">
                Reason: {displayReason}
              </p>
            )}
            {order.cancelled_at && (
              <p className="text-[10px] text-red-500">
                Timestamp: {new Date(order.cancelled_at).toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {/* Refund Status Callout for Prepaid Online Orders (Admin Handles Refund Directly) */}
          {isPrepaid && (
            <div className="rounded-xl border p-3.5 text-xs space-y-2">
              {isRefundCompleted ? (
                <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-lg text-emerald-950 space-y-1.5 shadow-2xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ Refund Completed & Money Sent (₹{formattedTotal})</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Dispensary admin has processed your refund directly to your original payment method.
                  </p>
                  <div className="pt-1.5 text-[10px] font-mono text-emerald-900 flex flex-wrap gap-x-4 gap-y-1 border-t border-emerald-200/60 mt-1">
                    <span>Reference / UTR: <strong className="text-emerald-950 font-bold">{extractedRef}</strong></span>
                    {order.refund_processed_at && (
                      <span>Date: {new Date(order.refund_processed_at).toLocaleDateString('en-IN')}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-lg text-amber-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Prepaid Online Refund Queued (₹{formattedTotal})</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    This order was paid online. Our dispensary admin will directly review and refund ₹{formattedTotal} to your original payment method. Your reference UTR will appear here once sent.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-[#f0f5f2] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-[11px] text-[#4b6356]">
          Payment Method: <span className="font-bold uppercase text-[#0a2e1e]">{order.payment_method}</span>{' '}
          ({order.payment_status})
        </div>

        {/* Rectangular Cancellation Action Button */}
        {isCancellable && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-3 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Cancel Order
          </button>
        )}

        {isShipped && (
          <span className="text-[11px] text-gray-500 italic">
            Dispatched via Cold-Pack Courier — Cannot be cancelled online
          </span>
        )}
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        order={order}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onOrderCancelled={handleCancelled}
      />
    </div>
  );
}
