import React from 'react';
import { X, User, Phone, Mail, MapPin, Package, ShoppingBag, CreditCard, Calendar } from 'lucide-react';

export default function CustomerDetailsModal({ isOpen, onClose, customer, onSelectOrder }) {
  if (!isOpen || !customer) return null;

  const orders = customer.orders || [];
  const avgOrderValue = customer.totalOrders > 0
    ? (customer.totalSpent / customer.totalOrders).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-[#d6e8dd] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0a2e1e] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700/80 border border-emerald-400/30 flex items-center justify-center text-sm font-bold text-white uppercase">
              {customer.name?.slice(0, 2) || 'PT'}
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold">{customer.name}</h2>
              <p className="text-xs text-[#a3e6be]">Patient Profile & Order History</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#f0faf4] rounded-xl border border-[#d6e8dd] text-center">
              <span className="text-[10px] uppercase font-bold text-gray-500">Total Orders</span>
              <p className="text-lg font-bold text-[#0a2e1e]">{customer.totalOrders || 0}</p>
            </div>
            <div className="p-3 bg-[#f0faf4] rounded-xl border border-[#d6e8dd] text-center">
              <span className="text-[10px] uppercase font-bold text-gray-500">Total Spent</span>
              <p className="text-lg font-sans font-bold text-emerald-800">₹{Number(customer.totalSpent || 0).toFixed(2)}</p>
            </div>
            <div className="p-3 bg-[#f0faf4] rounded-xl border border-[#d6e8dd] text-center">
              <span className="text-[10px] uppercase font-bold text-gray-500">Avg. Order Value</span>
              <p className="text-lg font-sans font-bold text-[#0a2e1e]">₹{avgOrderValue}</p>
            </div>
          </div>

          {/* Contact & Address Details */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5 text-xs">
            <h3 className="font-bold text-[#0a2e1e] uppercase tracking-wider text-[11px] border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>Contact & Delivery Profile</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{customer.phone || 'No phone recorded'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{customer.email || 'patient@ash-shifa.com'}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <span className="text-gray-800">{customer.primaryAddress || 'Standard Delivery Address'}</span>
            </div>
          </div>

          {/* Order History */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#0a2e1e] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-700" />
              <span>Prescription History ({orders.length})</span>
            </h3>

            {orders.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500 border border-dashed rounded-xl">
                No orders recorded for this patient yet.
              </div>
            ) : (
              <div className="border border-[#e2ece5] rounded-xl overflow-hidden divide-y divide-[#e2ece5]">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-3 bg-white flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0a2e1e]">{ord.id}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {(ord.order_status || 'confirmed').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {new Date(ord.created_at || Date.now()).toLocaleDateString('en-IN')} • {ord.payment_method?.toUpperCase()} • {ord.payment_status}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-sans text-xs font-bold text-[#0a2e1e]">
                        ₹{Number(ord.total_amount || 0).toFixed(2)}
                      </span>
                      {onSelectOrder && (
                        <button
                          onClick={() => {
                            onClose();
                            onSelectOrder(ord.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#0a2e1e] hover:bg-[#dcfce7] rounded-md transition-colors"
                        >
                          View Order →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-[#e2ece5] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#0a2e1e] hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
