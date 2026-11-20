import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  CreditCard,
  Truck,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Ban,
  AlertCircle,
  Printer,
  Navigation,
  ShieldCheck,
  Check,
  CheckSquare,
  Square,
  ArrowRight,
  Sparkles,
  Building,
  Smartphone,
  Send,
  Copy,
  ExternalLink,
  RefreshCw,
  DollarSign,
} from 'lucide-react';

const FULFILLMENT_STAGES = [
  {
    key: 'confirmed',
    step: 1,
    label: 'Confirmed',
    fullTitle: 'Order Confirmed',
    description: 'Prescription verified in dispensary database',
    icon: CheckCircle2,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    activeColor: 'bg-blue-600 text-white border-blue-600',
  },
  {
    key: 'processing',
    step: 2,
    label: 'Processing',
    fullTitle: 'Dispensary Prep & Packing',
    description: 'Herbal extracts bottled in amber miron glass',
    icon: Package,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    activeColor: 'bg-amber-600 text-white border-amber-600',
  },
  {
    key: 'shipped',
    step: 3,
    label: 'Shipped',
    fullTitle: 'Shipped (In Transit)',
    description: 'Dispatched via cold-pack clinical courier',
    icon: Truck,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    activeColor: 'bg-purple-600 text-white border-purple-600',
  },
  {
    key: 'out_for_delivery',
    step: 4,
    label: 'Out for Delivery',
    fullTitle: 'Out for Delivery',
    description: 'Courier executive assigned for final doorstep handover',
    icon: Navigation,
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    activeColor: 'bg-teal-600 text-white border-teal-600',
  },
  {
    key: 'delivered',
    step: 5,
    label: 'Delivered',
    fullTitle: 'Delivered to Patient',
    description: 'Safely handed over to patient with signature acknowledgment',
    icon: ShieldCheck,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    activeColor: 'bg-emerald-600 text-white border-emerald-600',
  },
];

export default function OrderDetailsModal({ isOpen, onClose, order, onUpdateStatus, onOpenSlip }) {
  if (!isOpen || !order) return null;

  const [orderStatus, setOrderStatus] = useState(order.order_status || 'confirmed');
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status || 'pending');
  const [autoMarkPaidOnDelivery, setAutoMarkPaidOnDelivery] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Admin Refund Dispatch States
  const [refundRef, setRefundRef] = useState(order.refund_transaction_ref || '');
  const [refundAmount, setRefundAmount] = useState(order.refund_amount || order.total_amount || '');
  const [copiedField, setCopiedField] = useState(null);
  const [processingRefund, setProcessingRefund] = useState(false);

  useEffect(() => {
    if (order) {
      setOrderStatus(order.order_status || 'confirmed');
      setPaymentStatus(order.payment_status || 'pending');
      setRefundRef(order.refund_transaction_ref || '');
      setRefundAmount(order.refund_amount || order.total_amount || '');
      setFeedback(null);
    }
  }, [order]);

  const handleCopy = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProcessRefund = async () => {
    setProcessingRefund(true);
    setFeedback(null);
    try {
      const refId = refundRef.trim() || `UTR-${Date.now().toString().slice(-8)}`;
      const amt = Number(refundAmount) || Number(order.total_amount);
      const updates = {
        payment_status: 'refunded',
        refund_status: 'completed',
        refund_transaction_ref: refId,
        refund_amount: amt,
        refund_processed_at: new Date().toISOString(),
      };
      setPaymentStatus('refunded');
      await onUpdateStatus(order.id, updates);
      setFeedback({
        type: 'success',
        message: `Refund of ₹${amt.toFixed(2)} marked as sent to customer! (Ref: ${refId})`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to process refund',
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  const currentStageIndex = FULFILLMENT_STAGES.findIndex((s) => s.key === orderStatus);
  const isCOD = (order.payment_method || '').toLowerCase() === 'cod';

  // 1-Click Tick & Update specific fulfillment stage
  const handleTickStage = async (stageKey) => {
    setSaving(true);
    setFeedback(null);
    try {
      const updates = { order_status: stageKey };

      // If ticking to 'delivered' on COD and auto-mark is enabled, also mark paid
      if (stageKey === 'delivered' && isCOD && autoMarkPaidOnDelivery && paymentStatus !== 'paid') {
        updates.payment_status = 'paid';
        setPaymentStatus('paid');
      }

      setOrderStatus(stageKey);
      await onUpdateStatus(order.id, updates);

      const targetStage = FULFILLMENT_STAGES.find((s) => s.key === stageKey);
      setFeedback({
        type: 'success',
        message: `Order #${order.id} ticked & updated to "${targetStage?.fullTitle || stageKey}"!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update order fulfillment status',
      });
    } finally {
      setSaving(false);
    }
  };

  // Full Save (Order Status + Payment Status)
  const handleSaveAll = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await onUpdateStatus(order.id, {
        order_status: orderStatus,
        payment_status: paymentStatus,
      });
      setFeedback({
        type: 'success',
        message: `Order #${order.id} statuses successfully saved to Supabase!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save order updates',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'out_for_delivery':
      case 'out of delivery':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'processing':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getPaymentBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'refund_requested':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  const items = order.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl border border-[#d6e8dd] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0a2e1e] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Package className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold">Order Details: {order.id}</h2>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(orderStatus)}`}>
                  {(orderStatus || '').replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-[#a3e6be] flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Placed on {new Date(order.created_at || Date.now()).toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenSlip && (
              <button
                type="button"
                onClick={() => onOpenSlip(order)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#0a2e1e] text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                title="Print delivery packing slip with payment details"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Delivery Slip</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {feedback && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
              <span className="font-semibold">{feedback.message}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* INTERACTIVE FULFILLMENT TICKER & TIMELINE STEPPER              */}
          {/* ============================================================== */}
          <div className="p-5 bg-gradient-to-br from-[#f0faf4] to-[#e6f4ec] rounded-2xl border-2 border-[#bbf7d0] space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c6f6d5] pb-3">
              <div>
                <h3 className="text-xs font-bold text-[#0a2e1e] uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <span>Tick Order Fulfillment Updates</span>
                </h3>
                <p className="text-[11px] text-[#2d503e]">
                  Click or tick any stage below to immediately advance delivery status in Supabase.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#0a2e1e] bg-white/80 px-2.5 py-1 rounded-lg border border-[#c6f6d5]">
                  Current: <span className="uppercase text-emerald-800">{(orderStatus || '').replace(/_/g, ' ')}</span>
                </span>
              </div>
            </div>

            {/* Stepper Progress Visual Bar */}
            <div className="relative pt-2 pb-1 hidden sm:block">
              <div className="absolute top-5 left-4 right-4 h-1 bg-[#cbd5e1] -translate-y-1/2 z-0 rounded-full" />
              <div
                className="absolute top-5 left-4 h-1 bg-emerald-600 -translate-y-1/2 z-0 rounded-full transition-all duration-300"
                style={{
                  width:
                    currentStageIndex === -1
                      ? '0%'
                      : `${(currentStageIndex / (FULFILLMENT_STAGES.length - 1)) * 96}%`,
                }}
              />

              <div className="relative z-10 grid grid-cols-5 text-center">
                {FULFILLMENT_STAGES.map((st, idx) => {
                  const isPassed = currentStageIndex >= idx;
                  const isCurrent = orderStatus === st.key;
                  const Icon = st.icon;

                  return (
                    <button
                      key={st.key}
                      onClick={() => handleTickStage(st.key)}
                      disabled={saving}
                      className="flex flex-col items-center group cursor-pointer disabled:opacity-50"
                      title={`Click to mark as ${st.fullTitle}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-xs ${
                          isCurrent
                            ? `${st.activeColor} ring-4 ring-emerald-300/60 scale-110`
                            : isPassed
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-400 border-gray-300 group-hover:border-emerald-500 group-hover:text-emerald-700'
                        }`}
                      >
                        {isPassed && !isCurrent ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] mt-1.5 font-bold transition-colors ${
                          isCurrent
                            ? 'text-[#0a2e1e]'
                            : isPassed
                            ? 'text-emerald-800'
                            : 'text-gray-500'
                        }`}
                      >
                        {st.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Stage Checklist Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {FULFILLMENT_STAGES.map((st, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = orderStatus === st.key;
                const Icon = st.icon;

                return (
                  <div
                    key={st.key}
                    onClick={() => handleTickStage(st.key)}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-white border-[#0a2e1e] shadow-md ring-2 ring-emerald-400/40'
                        : isPassed
                        ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/60'
                        : 'bg-white/70 border-gray-200 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox Icon */}
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                          isPassed
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'border-gray-300 bg-white text-transparent hover:border-gray-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#0a2e1e]' : isPassed ? 'text-emerald-700' : 'text-gray-400'}`} />
                          <span className={`text-xs font-bold ${isCurrent ? 'text-[#0a2e1e]' : isPassed ? 'text-emerald-950' : 'text-gray-700'}`}>
                            {st.fullTitle}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                          {st.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all shrink-0 ${
                        isCurrent
                          ? 'bg-[#0a2e1e] text-white'
                          : isPassed
                          ? 'bg-emerald-200 text-emerald-900 hover:bg-emerald-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isCurrent ? '✓ Active' : isPassed ? '✓ Done' : 'Tick'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Smart COD Auto-Paid Toggle */}
            {isCOD && (
              <div className="pt-2 border-t border-[#c6f6d5] flex items-center justify-between text-xs text-[#0a2e1e]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoMarkPaidOnDelivery}
                    onChange={(e) => setAutoMarkPaidOnDelivery(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-[11px]">
                    Auto-mark payment as <span className="text-emerald-700 font-bold">PAID</span> when ticking "Delivered" (Collect ₹{Number(order.total_amount || 0).toFixed(2)})
                  </span>
                </label>

                {saving && (
                  <span className="text-[11px] font-bold text-emerald-800 animate-pulse">
                    Updating Supabase...
                  </span>
                )}
              </div>
            )}

            {/* Manual Payment Status & Overrides Bar */}
            <div className="pt-2 border-t border-[#c6f6d5] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0a2e1e] text-[11px]">Payment Status:</span>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTickStage('cancelled')}
                  className="px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                >
                  Cancel Order
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="px-3.5 py-1 text-[11px] font-bold bg-[#0a2e1e] hover:bg-[#072417] text-white rounded-lg shadow-xs transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Cancellation Banner if cancelled */}
          {orderStatus === 'cancelled' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Ban className="w-4 h-4 text-red-600" />
                <span>Order Cancelled</span>
              </div>
              <p className="text-red-700">Reason: {order.cancellation_reason || 'Dispensary administrative cancellation'}</p>
              {order.cancelled_at && (
                <p className="text-[10px] text-red-500">Cancelled at: {new Date(order.cancelled_at).toLocaleString('en-IN')}</p>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* ONLINE PAYMENT DIRECT ADMIN REFUND PANEL                       */}
          {/* ============================================================== */}
          {(orderStatus === 'cancelled' || paymentStatus === 'refunded') && (order.payment_method === 'razorpay' || paymentStatus === 'paid' || paymentStatus === 'refunded' || order.refund_status) && (
            <div className="p-4 bg-gradient-to-br from-amber-50/90 to-amber-100/40 border-2 border-amber-300 rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500 text-white rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Online Payment Refund (Admin Console)
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      Process direct refund for cancelled online order (₹{Number(order.total_amount || 0).toFixed(2)})
                    </p>
                  </div>
                </div>

                <div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                    paymentStatus === 'refunded'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-200 text-amber-900 border-amber-400 animate-pulse'
                  }`}>
                    {paymentStatus === 'refunded' ? '✓ Refund Completed' : '⚠️ Refund Pending'}
                  </span>
                </div>
              </div>

              {/* Order Online Payment Summary */}
              <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-gray-500 block">Payment Method:</span>
                  <strong className="text-gray-900 font-semibold uppercase">{order.payment_method || 'Online'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Razorpay / Transaction ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-[#0a2e1e] truncate">
                      {order.razorpay_payment_id || 'RZP-PREPAID-VERIFIED'}
                    </span>
                    {order.razorpay_payment_id && (
                      <button
                        type="button"
                        onClick={() => handleCopy(order.razorpay_payment_id, 'rzp')}
                        className="p-1 text-gray-500 hover:text-emerald-700"
                        title="Copy payment ID"
                      >
                        {copiedField === 'rzp' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Customer Phone:</span>
                  <strong className="text-gray-900 font-semibold">{order.shipping_phone || 'N/A'}</strong>
                </div>
              </div>

              {/* Settlement Form: Admin directly does the refund */}
              {paymentStatus === 'refunded' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Refund Settled & Transferred (₹{Number(order.refund_amount || order.total_amount).toFixed(2)})</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-mono">
                      Transfer Ref / UTR: <strong className="text-emerald-950">{order.refund_transaction_ref || 'UTR-COMPLETED'}</strong>
                      {order.refund_processed_at && (
                        <span className="ml-2 font-sans text-gray-600">• Sent: {new Date(order.refund_processed_at).toLocaleString('en-IN')}</span>
                      )}
                    </p>
                  </div>
                  <span className="bg-emerald-600 text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded-md">
                    Settled
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                    Admin Refund Execution & Money Return
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1">
                        Bank UTR / Razorpay Refund Reference ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UTR-9204918204 or RZP-REF-..."
                        value={refundRef}
                        onChange={(e) => setRefundRef(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1">
                        Refund Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none font-sans font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-[10px] text-gray-500">
                      Transfer refund to customer via net banking, UPI, or Razorpay dashboard, then record here.
                    </p>
                    <button
                      type="button"
                      disabled={processingRefund}
                      onClick={handleProcessRefund}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {processingRefund ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>💸 Process Refund & Mark Refunded</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Two-column grid: Customer & Shipping | Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer & Shipping Details */}
            <div className="p-4 bg-white rounded-xl border border-[#e2ece5] shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-[#0a2e1e] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#f0f0f0] pb-2">
                <User className="w-4 h-4 text-emerald-700" />
                <span>Customer & Delivery Details</span>
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer Name:</span>
                  <span className="font-bold text-[#0a2e1e]">{order.shipping_name || 'Valued Patient'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact Phone:</span>
                  <span className="font-semibold text-[#0a2e1e]">{order.shipping_phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Address:</span>
                  <span className="font-medium text-[#0a2e1e] text-right max-w-[60%]">
                    {order.shipping_address || 'Clinic Pickup / Standard Address'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">City / State:</span>
                  <span className="font-medium text-[#0a2e1e]">
                    {[order.shipping_city, order.shipping_state].filter(Boolean).join(', ') || 'India'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Postal Pincode:</span>
                  <span className="font-bold text-[#0a2e1e]">{order.shipping_pincode || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="p-4 bg-white rounded-xl border border-[#e2ece5] shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-[#0a2e1e] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#f0f0f0] pb-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>Payment & Transaction Details</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="font-bold uppercase text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                    {order.payment_method === 'razorpay' ? '💳 Razorpay Online Gateway' : '💵 Cash on Delivery (COD)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full border ${getPaymentBadge(paymentStatus)}`}>
                    {paymentStatus || 'Pending'}
                  </span>
                </div>
                {order.razorpay_payment_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Razorpay Payment ID:</span>
                    <span className="font-mono text-[11px] text-[#0a2e1e] bg-gray-50 px-1.5 py-0.5 rounded">
                      {order.razorpay_payment_id}
                    </span>
                  </div>
                )}
                {order.razorpay_order_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Razorpay Order ID:</span>
                    <span className="font-mono text-[11px] text-[#0a2e1e] bg-gray-50 px-1.5 py-0.5 rounded">
                      {order.razorpay_order_id}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-[#f0f0f0]">
                  <span className="text-gray-600 font-semibold">Total Transaction:</span>
                  <span className="font-sans text-base font-bold text-[#0a2e1e]">
                    ₹{Number(order.total_amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Items List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#0a2e1e] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-700" />
              <span>Prescription Items Ordered ({items.length})</span>
            </h3>

            <div className="border border-[#e2ece5] rounded-xl overflow-hidden divide-y divide-[#e2ece5]">
              {items.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">No specific line item records attached</div>
              ) : (
                items.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 bg-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                        <img
                          src={item.product_image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80'}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0a2e1e]">{item.product_name || item.name}</h4>
                        <p className="text-[11px] text-gray-500">
                          Unit Price: <span className="font-sans font-semibold">₹{Number(item.unit_price || item.price || 0).toFixed(2)}</span> × Quantity: {item.quantity || 1}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-sans text-xs font-bold text-[#0a2e1e]">
                        ₹{Number(item.total_price || (item.unit_price || item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Financial Totals Breakdown */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-sans">₹{Number(order.subtotal || order.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Clinical Courier & Shipping:</span>
                <span className="font-semibold text-emerald-700">
                  {Number(order.shipping_fee || 0) > 0 ? `₹${Number(order.shipping_fee).toFixed(2)}` : 'FREE (Cold-Pack)'}
                </span>
              </div>
              {Number(order.tax_amount || 0) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>GST / Pharmacopeia Tax:</span>
                  <span className="font-sans">₹{Number(order.tax_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-[#0a2e1e] pt-2 border-t border-gray-200">
                <span>Total Amount Charged:</span>
                <span className="font-sans text-base">₹{Number(order.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-[#e2ece5] flex items-center justify-between">
          <div>
            {onOpenSlip && (
              <button
                type="button"
                onClick={() => onOpenSlip(order)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0a2e1e] hover:bg-[#072417] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Download / Print Order Slip</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#0a2e1e] hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
