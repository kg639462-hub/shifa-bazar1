import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { getUserOrders } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import OrderCard from '../components/orders/OrderCard';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchOrders = async (showFullLoading = true) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (showFullLoading) setLoading(true);
    setIsRefreshing(true);

    try {
      const res = await getUserOrders();
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.warn('Could not fetch user orders:', err.message);
    } finally {
      if (showFullLoading) setLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    // Initial fetch with full loader
    fetchOrders(true);

    // 1. Automatic background polling every 3.5 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders(false);
      }
    }, 3500);

    // 2. Refresh on window focus and tab visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders(false);
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    // 3. Supabase Realtime channel for instant order updates
    let channel = null;
    if (isSupabaseConfigured() && supabase) {
      try {
        channel = supabase
          .channel('public:orders:realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => {
              fetchOrders(false);
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime subscription notice:', err.message);
      }
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleOrderUpdated = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#4b6356] uppercase tracking-wider">
            <Link to="/" className="hover:text-[#0a2e1e] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Compendium
            </Link>
            <span>/</span>
            <span className="text-[#0a2e1e]">Dispensary Orders</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0a2e1e] mt-1">
            Patient Order History & Regimens
          </h1>
          <p className="text-xs sm:text-sm text-[#4b6356]">
            View real-time preparation status, tracking codes, and cancel orders prior to cold-pack dispatch.
          </p>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          className="p-2.5 rounded-xl border border-[#d6e8dd] bg-white text-[#0a2e1e] hover:bg-[#f0faf4] transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          title="Refresh orders from dispensary"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-xs font-semibold hidden sm:inline">Sync Live</span>
        </button>
      </div>

      {/* Cancellation Policy Banner */}
      <div className="p-4 rounded-2xl bg-[#eaf5ee] border border-[#d6e8dd] flex items-center gap-3 text-xs text-[#0a2e1e]">
        <ShieldAlert className="w-5 h-5 text-emerald-800 shrink-0" />
        <p>
          <strong>Pre-Dispatch Cancellation Guarantee:</strong> You may cancel any un-shipped preparation directly online. Once an order enters cold-pack courier transit, cancellations cannot be accepted.
        </p>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-12 text-center text-[#4b6356]">
          <div className="w-8 h-8 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Querying dispensary database...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-[#e2ece5] text-center space-y-4">
          <Package className="w-12 h-12 text-[#4b6356] mx-auto opacity-40" />
          <h3 className="font-serif text-lg font-bold text-[#0a2e1e]">
            No Dispensary Orders Found
          </h3>
          <p className="text-xs text-[#4b6356] max-w-sm mx-auto">
            You haven't ordered any botanical tinctures or capsules yet. Explore our compendium to place your first order.
          </p>
          <Link
            to="/"
            className="inline-block bg-[#0a2e1e] text-white px-5 py-2.5 rounded-xl text-xs font-bold"
          >
            Explore Formulations
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateOrder={handleOrderUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
