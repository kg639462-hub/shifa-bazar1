import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Edit,
  Search,
  Filter,
  CreditCard,
  User,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Truck,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  LogOut,
  MailCheck,
  Printer,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminOrders,
  updateAdminOrderStatus,
  getAdminCustomers,
} from '../api/admin';
import ProductFormModal from '../components/admin/ProductFormModal';
import OrderDetailsModal from '../components/admin/OrderDetailsModal';
import CustomerDetailsModal from '../components/admin/CustomerDetailsModal';
import OrderSlipModal from '../components/admin/OrderSlipModal';
import AdminLoginGate from '../components/admin/AdminLoginGate';

export default function AdminPage() {
  const { user, signOut: authSignOut } = useAuth();
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'products' | 'orders' | 'payments' | 'customers'

  // Data states
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [customerSearch, setCustomerSearch] = useState('');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [slipOrder, setSlipOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Check admin clearance with Supabase (must have confirmed email AND role = 'admin')
  const checkAdminClearance = async (targetUser) => {
    const candidate = targetUser || user;
    if (!candidate) {
      setIsAdminVerified(false);
      setAdminUser(null);
      setAuthChecking(false);
      return false;
    }

    // 1. Strict Requirement: Verified Email Check
    const isEmailVerified = Boolean(candidate.email_confirmed_at || candidate.confirmed_at);
    if (!isEmailVerified) {
      setIsAdminVerified(false);
      setAdminUser(null);
      setAuthChecking(false);
      return false;
    }

    // 2. Strict Requirement: Approved role = 'admin' in Supabase check
    let approved = false;
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', candidate.id)
          .single();

        if (profile?.role === 'admin') {
          approved = true;
        }
      } catch (err) {
        console.warn('Supabase admin check warning:', err.message);
      }
    }

    if (!approved && (candidate.user_metadata?.role === 'admin' || candidate.app_metadata?.role === 'admin')) {
      approved = true;
    }

    if (approved && isEmailVerified) {
      setIsAdminVerified(true);
      setAdminUser(candidate);
      setAuthChecking(false);
      return true;
    }

    setIsAdminVerified(false);
    setAdminUser(null);
    setAuthChecking(false);
    return false;
  };

  useEffect(() => {
    checkAdminClearance(user);
  }, [user]);

  // Load all admin data once verified
  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsData, ordersData, custsData] = await Promise.all([
        getAdminProducts(),
        getAdminOrders(),
        getAdminCustomers(),
      ]);
      setProducts(prodsData || []);
      setOrders(ordersData || []);
      setCustomers(custsData || []);
    } catch (err) {
      console.error('Error loading admin portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminVerified) {
      loadData();
    }
  }, [isAdminVerified]);

  // Product Actions
  const handleSaveProduct = async (payload, id) => {
    if (id) {
      await updateAdminProduct(id, payload);
    } else {
      await createAdminProduct(payload);
    }
    await loadData();
  };

  const handleDeleteProduct = async (id) => {
    await deleteAdminProduct(id);
    await loadData();
    setDeleteConfirmId(null);
  };

  // Order Actions
  const handleUpdateOrderStatus = async (id, updates) => {
    const updated = await updateAdminOrderStatus(id, updates);
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates, ...updated } : o))
    );
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder((prev) => ({ ...prev, ...updates, ...updated }));
    }
    // Refresh customers to update metrics
    const custs = await getAdminCustomers();
    if (custs) setCustomers(custs);
  };

  const handleQuickTickStage = async (orderId, newStage, ord) => {
    setUpdatingOrderId(orderId);
    try {
      const updates = { order_status: newStage };
      // If advancing to delivered on COD, also auto-mark payment as paid
      if (newStage === 'delivered' && (ord.payment_method || '').toLowerCase() === 'cod' && ord.payment_status !== 'paid') {
        updates.payment_status = 'paid';
      }
      await handleUpdateOrderStatus(orderId, updates);
    } catch (err) {
      console.error('Failed to quick tick order stage:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Metrics Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalPaidRevenue = orders
    .filter((o) => o.payment_status?.toLowerCase() === 'paid')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalRefunded = orders
    .filter((o) => o.payment_status?.toLowerCase() === 'refunded')
    .reduce((sum, o) => sum + (Number(o.refund_amount || o.total_amount) || 0), 0);
  const pendingRefunds = orders.filter(
    (o) =>
      (o.payment_method === 'razorpay' || o.payment_status === 'paid' || o.payment_status === 'refund_requested') &&
      o.order_status === 'cancelled' &&
      o.payment_status !== 'refunded' &&
      o.refund_status !== 'completed'
  );
  const pendingRefundsTotal = pendingRefunds.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const pendingOrdersCount = orders.filter(
    (o) => o.order_status !== 'delivered' && o.order_status !== 'cancelled'
  ).length;
  const lowStockProducts = products.filter((p) => (Number(p.stock) || 0) <= 20);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.scientific_name || '').toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = productCategory === 'All' || p.category === productCategory;
    return matchesSearch && matchesCat;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.id || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.shipping_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.shipping_phone || '').includes(orderSearch);
    const matchesStatus =
      orderStatusFilter === 'All' ||
      (o.order_status || '').toLowerCase() === orderStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Filtered Payments
  const filteredPayments = orders.filter((o) => {
    if (paymentFilter === 'All') return true;
    if (paymentFilter === 'cod') return o.payment_method === 'cod';
    if (paymentFilter === 'razorpay') return o.payment_method === 'razorpay';
    if (paymentFilter === 'paid') return o.payment_status === 'paid';
    if (paymentFilter === 'pending') return o.payment_status === 'pending';
    if (paymentFilter === 'needs_refund' || paymentFilter === 'refund_requested') {
      return (
        (o.payment_method === 'razorpay' || o.payment_status === 'paid' || o.payment_status === 'refund_requested') &&
        o.order_status === 'cancelled' &&
        o.payment_status !== 'refunded'
      );
    }
    if (paymentFilter === 'refunded') return o.payment_status === 'refunded' || o.refund_status === 'completed';
    return true;
  });

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    return (
      (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone || '').includes(customerSearch) ||
      (c.email || '').toLowerCase().includes(customerSearch.toLowerCase())
    );
  });

  // Render loading state while verifying admin clearance
  if (authChecking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#0a2e1e] border-t-emerald-400 rounded-full animate-spin"></div>
        <div className="text-center space-y-1">
          <p className="font-serif text-base font-bold text-[#0a2e1e]">
            Verifying Supabase Administrator Clearance
          </p>
          <p className="text-xs text-gray-500">Checking email verification status and database role...</p>
        </div>
      </div>
    );
  }

  // Render Admin Login Gate if not authenticated, unverified, or not an approved admin
  if (!isAdminVerified) {
    return (
      <AdminLoginGate
        currentUser={user}
        onLoginSuccess={async (authedUser) => {
          setAuthChecking(true);
          await checkAdminClearance(authedUser);
        }}
        onSignOut={async () => {
          await authSignOut();
          setIsAdminVerified(false);
          setAdminUser(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Portal Header Banner */}
      <div className="bg-[#0a2e1e] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-emerald-800/60 border border-emerald-500/30 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ash-Shifa Dispensary Administrative Portal</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
              Apothecary Management & Operations
            </h1>
            <p className="text-xs sm:text-sm text-[#a3e6be] max-w-2xl">
              Real-time compendium cataloging, pharmaceutical stock management, patient orders ledger, and payment tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Verified Admin Identity Badge */}
            <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs">
              <MailCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <div className="text-left">
                <span className="font-mono text-emerald-200 block text-[11px] font-bold leading-tight truncate max-w-[180px]">
                  {adminUser?.email || user?.email}
                </span>
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">
                  ✓ Verified Supabase Admin
                </span>
              </div>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition-colors"
              title="Refresh all data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#0a2e1e] rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>

            <button
              onClick={async () => {
                await authSignOut();
                setIsAdminVerified(false);
                setAdminUser(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-950/70 hover:bg-red-900 border border-red-500/30 text-red-200 rounded-lg text-xs font-bold transition-colors"
              title="Sign out of Administrator Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-emerald-800/70 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: TrendingUp },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'payments', label: 'Payment Ledger', icon: CreditCard },
            { id: 'customers', label: `Customers (${customers.length})`, icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all shrink-0 ${
                  isActive
                    ? 'bg-white text-[#0a2e1e] font-bold shadow-sm'
                    : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-[#e2ece5] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <p className="font-sans text-2xl font-bold text-[#0a2e1e]">
                ₹{totalRevenue.toFixed(2)}
              </p>
              <p className="text-[11px] text-gray-500">
                ₹{totalPaidRevenue.toFixed(2)} verified & collected
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#e2ece5] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="font-sans text-2xl font-bold text-[#0a2e1e]">
                {orders.length}
              </p>
              <p className="text-[11px] text-blue-600 font-medium">
                {pendingOrdersCount} orders in active fulfillment
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#e2ece5] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Formulations</span>
                <div className="p-2 bg-amber-50 text-amber-800 rounded-lg">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <p className="font-sans text-2xl font-bold text-[#0a2e1e]">
                {products.length}
              </p>
              <p className="text-[11px] text-gray-500">
                {lowStockProducts.length > 0 ? (
                  <span className="text-amber-600 font-semibold">{lowStockProducts.length} low in stock</span>
                ) : (
                  'All formulations well stocked'
                )}
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#e2ece5] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Registered Patients</span>
                <div className="p-2 bg-purple-50 text-purple-800 rounded-lg">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <p className="font-sans text-2xl font-bold text-[#0a2e1e]">
                {customers.length}
              </p>
              <p className="text-[11px] text-gray-500">
                Engaged botanical dispensary patients
              </p>
            </div>
          </div>

          {/* Quick Alert: Low Stock Warning */}
          {lowStockProducts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Low Stock Notice</h4>
                  <p className="text-[11px] text-amber-800">
                    {lowStockProducts.map((p) => `${p.name} (${p.stock} units left)`).join(', ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('products')}
                className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 rounded-lg transition-colors shrink-0"
              >
                Manage Stock
              </button>
            </div>
          )}

          {/* Recent Orders Preview */}
          <div className="bg-white rounded-xl border border-[#e2ece5] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#e2ece5] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#0a2e1e]">Recent Orders</h3>
                <p className="text-xs text-gray-500">Latest prescriptions received by the dispensary</p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-[#0a2e1e] hover:underline flex items-center gap-1"
              >
                <span>View All Orders</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faf9] text-gray-600 font-semibold border-b border-[#e2ece5]">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Total (₹)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2ece5]">
                  {orders.slice(0, 5).map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#0a2e1e]">{ord.id}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900 block">{ord.shipping_name}</span>
                        <span className="text-[10px] text-gray-500">{ord.shipping_phone}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(ord.created_at || Date.now()).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {ord.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`capitalize text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          ord.order_status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : ord.order_status === 'out_for_delivery'
                            ? 'bg-teal-50 text-teal-800 border-teal-300'
                            : ord.order_status === 'shipped'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : ord.order_status === 'processing'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : ord.order_status === 'cancelled'
                            ? 'bg-red-50 text-red-800 border-red-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}>
                          {(ord.order_status || 'confirmed').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans font-bold text-[#0a2e1e]">
                        ₹{Number(ord.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 hover:bg-[#dcfce7] text-[#0a2e1e] rounded-md transition-colors"
                            title="Inspect Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSlipOrder(ord)}
                            className="p-1.5 hover:bg-emerald-100 text-emerald-800 rounded-md transition-colors"
                            title="Print Delivery Packing Slip & Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#e2ece5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by remedy name or botanical..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
                />
              </div>

              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none bg-white"
              >
                <option value="All">All Categories</option>
                <option value="Formulation">Formulation</option>
                <option value="Tincture">Tincture</option>
                <option value="Capsules">Capsules</option>
                <option value="Topical Balm">Topical Balm</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0a2e1e] hover:bg-[#072417] text-white rounded-lg text-xs font-bold shadow-xs transition-all w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-[#e2ece5] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faf9] text-gray-600 font-semibold border-b border-[#e2ece5]">
                  <tr>
                    <th className="py-3 px-4">Remedy</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Selling Price (₹)</th>
                    <th className="py-3 px-4">MRP / Discount</th>
                    <th className="py-3 px-4">Stock Level</th>
                    <th className="py-3 px-4 text-center">Images</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2ece5]">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">
                        No remedies found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const selling = Number(p.price) || 0;
                      const original = Number(p.original_price) || Math.round(selling * 1.25);
                      const discountPct = original > selling ? Math.round(((original - selling) / original) * 100) : 0;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                                <img
                                  src={p.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80'}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <span className="font-bold text-[#0a2e1e] block">{p.name}</span>
                                <span className="text-[10px] text-gray-500 italic block">{p.scientific_name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans font-bold text-sm text-[#0a2e1e]">
                            ₹{selling.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="line-through text-gray-400 font-sans text-xs">
                                ₹{original.toFixed(2)}
                              </span>
                              {discountPct > 0 && (
                                <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.2 rounded border border-red-200">
                                  {discountPct}% OFF
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                Number(p.stock) > 20
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : Number(p.stock) > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {p.stock} in stock
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                              {(p.images || []).length} images
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setIsProductModalOpen(true);
                                }}
                                className="p-1.5 text-gray-600 hover:text-[#0a2e1e] hover:bg-[#dcfce7] rounded-md transition-colors"
                                title="Edit Product"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(p.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Orders Filters */}
          <div className="bg-white p-4 rounded-xl border border-[#e2ece5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Order ID, Patient name, or phone..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-gray-500 font-semibold shrink-0">Status:</span>
              {[
                { id: 'All', label: 'All Orders' },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'processing', label: 'Processing' },
                { id: 'shipped', label: 'Shipped' },
                { id: 'out_for_delivery', label: 'Out for Delivery' },
                { id: 'delivered', label: 'Delivered' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setOrderStatusFilter(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    orderStatusFilter.toLowerCase() === item.id.toLowerCase()
                      ? 'bg-[#0a2e1e] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List Table */}
          <div className="bg-white rounded-xl border border-[#e2ece5] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faf9] text-gray-600 font-semibold border-b border-[#e2ece5]">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Patient / Recipient</th>
                    <th className="py-3 px-4">Prescription Items</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4 min-w-[210px]">Fulfillment Stage & Quick Tick</th>
                    <th className="py-3 px-4 text-right">Total (₹)</th>
                    <th className="py-3 px-4 text-center">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2ece5]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-gray-500">
                        No orders found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#0a2e1e]">{ord.id}</td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(ord.created_at || Date.now()).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900 block">{ord.shipping_name}</span>
                          <span className="text-[10px] text-gray-500">{ord.shipping_phone}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-700">
                            {(ord.items || []).length} items
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {ord.payment_method === 'razorpay' ? 'Razorpay Online' : 'COD (Cash)'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`capitalize text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ord.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.payment_status === 'refunded'
                                ? 'bg-purple-100 text-purple-800'
                                : ord.payment_status === 'refund_requested' || ord.refund_status === 'requested'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.payment_status === 'refund_requested' ? 'Refund Requested' : (ord.payment_status || 'pending')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            {/* Current Stage Badge */}
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`capitalize text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  ord.order_status === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : ord.order_status === 'out_for_delivery'
                                    ? 'bg-teal-50 text-teal-800 border-teal-300'
                                    : ord.order_status === 'shipped'
                                    ? 'bg-purple-50 text-purple-800 border-purple-300'
                                    : ord.order_status === 'processing'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : ord.order_status === 'cancelled'
                                    ? 'bg-red-50 text-red-800 border-red-300'
                                    : 'bg-blue-50 text-blue-800 border-blue-300'
                                }`}
                              >
                                {(ord.order_status || 'confirmed').replace(/_/g, ' ')}
                              </span>

                              {updatingOrderId === ord.id && (
                                <span className="text-[10px] text-emerald-700 font-bold animate-pulse">
                                  Updating...
                                </span>
                              )}
                            </div>

                            {/* Quick Tick Action Stepper Buttons */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {/* Quick Tick: Confirmed/Processing -> Shipped */}
                              {['confirmed', 'processing'].includes(ord.order_status) && (
                                <button
                                  type="button"
                                  disabled={updatingOrderId === ord.id}
                                  onClick={() => handleQuickTickStage(ord.id, 'shipped', ord)}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-900 rounded border border-purple-300 transition-colors flex items-center gap-1 active:scale-95 shadow-2xs"
                                  title="Tick to mark as Shipped (In Transit)"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>✓ Ship</span>
                                </button>
                              )}

                              {/* Quick Tick: Shipped -> Out for Delivery */}
                              {ord.order_status === 'shipped' && (
                                <button
                                  type="button"
                                  disabled={updatingOrderId === ord.id}
                                  onClick={() => handleQuickTickStage(ord.id, 'out_for_delivery', ord)}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 hover:bg-teal-200 text-teal-900 rounded border border-teal-300 transition-colors flex items-center gap-1 active:scale-95 shadow-2xs"
                                  title="Tick to mark as Out for Delivery"
                                >
                                  <Navigation className="w-3 h-3" />
                                  <span>✓ Out for Del.</span>
                                </button>
                              )}

                              {/* Quick Tick: Out for Delivery (or Shipped) -> Delivered */}
                              {['shipped', 'out_for_delivery'].includes(ord.order_status) && (
                                <button
                                  type="button"
                                  disabled={updatingOrderId === ord.id}
                                  onClick={() => handleQuickTickStage(ord.id, 'delivered', ord)}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors flex items-center gap-1 active:scale-95 shadow-2xs"
                                  title="Tick to mark as Delivered"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>✓ Deliver</span>
                                </button>
                              )}

                              {/* Direct Status Selector Menu */}
                              <select
                                value={ord.order_status || 'confirmed'}
                                disabled={updatingOrderId === ord.id}
                                onChange={(e) => handleQuickTickStage(ord.id, e.target.value, ord)}
                                className="text-[10px] font-semibold bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 hover:bg-white focus:outline-none"
                                title="Change fulfillment stage"
                              >
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-sans font-bold text-sm text-[#0a2e1e]">
                          ₹{Number(ord.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {((ord.order_status === 'cancelled' && (ord.payment_method === 'razorpay' || ord.payment_status === 'paid') && ord.payment_status !== 'refunded') || ord.payment_status === 'refund_requested') && (
                              <button
                                onClick={() => setSelectedOrder(ord)}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded shadow-xs transition-colors flex items-center gap-1 active:scale-95 animate-pulse"
                                title="Issue Online Refund"
                              >
                                <span>💸 Issue Refund</span>
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="px-2.5 py-1 bg-[#f0faf4] hover:bg-[#dcfce7] text-[#0a2e1e] font-bold text-[11px] rounded border border-[#c6f6d5] transition-colors"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => setSlipOrder(ord)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded shadow-xs transition-colors flex items-center gap-1 active:scale-95"
                              title="Print / Download Delivery Packing Slip with Payment"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Slip</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT LEDGER */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Payment Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#e2ece5] shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Total Revenue</span>
              <p className="font-sans text-2xl font-bold text-[#0a2e1e]">₹{totalRevenue.toFixed(2)}</p>
              <p className="text-[10px] text-gray-500">Gross prescription value</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#e2ece5] shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Paid / Verified</span>
              <p className="font-sans text-2xl font-bold text-emerald-800">₹{totalPaidRevenue.toFixed(2)}</p>
              <p className="text-[10px] text-gray-500">Collected online via Razorpay or paid on delivery</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#e2ece5] shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-amber-700 uppercase">COD Pending Payment</span>
              <p className="font-sans text-2xl font-bold text-amber-800">
                ₹{(totalRevenue - totalPaidRevenue).toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-500">Awaiting clinical delivery collection</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#e2ece5] shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-purple-700 uppercase">Refunds Settled</span>
              <p className="font-sans text-2xl font-bold text-purple-800">₹{totalRefunded.toFixed(2)}</p>
              <p className="text-[10px] text-gray-500">
                {pendingRefunds.length > 0 ? (
                  <span className="text-amber-700 font-bold">{pendingRefunds.length} pending request (₹{pendingRefundsTotal.toFixed(2)})</span>
                ) : (
                  'All cancelled refunds settled'
                )}
              </p>
            </div>
          </div>

          {/* CANCELLED ONLINE ORDERS AWAITING REFUND (Admin Direct Refund Console) */}
          {pendingRefunds.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-600 text-white rounded-lg">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Cancelled Online Orders Awaiting Refund ({pendingRefunds.length} Pending)
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      Prepaid orders cancelled before dispatch • Admin issues refund directly to customer
                    </p>
                  </div>
                </div>
                <span className="bg-amber-200 text-amber-900 font-bold text-xs px-2.5 py-1 rounded-full border border-amber-300 self-start sm:self-auto">
                  Action Required: ₹{pendingRefundsTotal.toFixed(2)}
                </span>
              </div>

              <div className="divide-y divide-amber-200/60 bg-white rounded-lg border border-amber-200 overflow-hidden">
                {pendingRefunds.map((o) => (
                  <div key={o.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-amber-50/40 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0a2e1e]">{o.id}</span>
                        <span className="font-semibold text-gray-900">• {o.shipping_name}</span>
                        <span className="text-[10px] text-gray-500">({o.shipping_phone})</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] flex-wrap">
                        <span className="text-gray-500">Payment:</span>
                        <span className="font-bold uppercase text-[#0a2e1e]">{o.payment_method || 'Online'}</span>
                        {o.razorpay_payment_id && (
                          <span className="font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                            ID: {o.razorpay_payment_id}
                          </span>
                        )}
                        <span className="text-red-700 italic">({o.cancellation_reason || 'Cancelled'})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase block font-bold">Refund Amount</span>
                        <span className="font-sans text-sm font-bold text-emerald-800">₹{Number(o.total_amount || 0).toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-3.5 py-1.5 bg-[#0a2e1e] hover:bg-[#072417] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <span>💸 Issue Refund</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-gray-500 font-semibold shrink-0">Filter:</span>
            {[
              { id: 'All', label: 'All Transactions' },
              { id: 'razorpay', label: 'Razorpay Online' },
              { id: 'cod', label: 'Cash on Delivery' },
              { id: 'paid', label: 'Verified Paid' },
              { id: 'needs_refund', label: 'Awaiting Refund' },
              { id: 'refunded', label: 'Refunded' },
              { id: 'pending', label: 'Pending' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setPaymentFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  paymentFilter === f.id
                    ? 'bg-[#0a2e1e] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl border border-[#e2ece5] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faf9] text-gray-600 font-semibold border-b border-[#e2ece5]">
                  <tr>
                    <th className="py-3 px-4">Transaction / Order ID</th>
                    <th className="py-3 px-4">Payer / Customer</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Gateway Reference</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2ece5]">
                  {filteredPayments.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#0a2e1e]">{o.id}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{o.shipping_name}</td>
                      <td className="py-3 px-4">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                          {o.payment_method === 'razorpay' ? 'Razorpay' : 'COD'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-600">
                        {o.razorpay_payment_id || 'COD-Apothecary-Cash'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`capitalize text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            o.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.payment_status || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(o.created_at || Date.now()).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-sans font-bold text-sm text-[#0a2e1e]">
                        ₹{Number(o.total_amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PATIENTS & CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* Customer Search */}
          <div className="bg-white p-4 rounded-xl border border-[#e2ece5] shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient by name, phone or email..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
              />
            </div>
            <span className="text-xs text-gray-500 font-semibold">
              Showing {filteredCustomers.length} patients
            </span>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-xl border border-[#e2ece5] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faf9] text-gray-600 font-semibold border-b border-[#e2ece5]">
                  <tr>
                    <th className="py-3 px-4">Patient Profile</th>
                    <th className="py-3 px-4">Contact Details</th>
                    <th className="py-3 px-4">Delivery Address</th>
                    <th className="py-3 px-4 text-center">Total Orders</th>
                    <th className="py-3 px-4 text-right">Lifetime Spend (₹)</th>
                    <th className="py-3 px-4 text-center">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2ece5]">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-500">
                        No patient records found.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => (
                      <tr key={c.id || c.phone} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0a2e1e] text-white flex items-center justify-center font-bold text-xs uppercase">
                              {c.name?.slice(0, 2) || 'PT'}
                            </div>
                            <div>
                              <span className="font-bold text-[#0a2e1e] block">{c.name}</span>
                              <span className="text-[10px] text-gray-500">Patient</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900 block">{c.phone || 'N/A'}</span>
                          <span className="text-[10px] text-gray-500 block truncate max-w-[180px]">{c.email}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate">
                          {c.primaryAddress || 'Standard Delivery'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                            {c.totalOrders || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-sans font-bold text-sm text-[#0a2e1e]">
                          ₹{Number(c.totalSpent || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="px-2.5 py-1 text-xs font-semibold text-[#0a2e1e] hover:bg-[#dcfce7] rounded-md transition-colors"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full border border-gray-200 shadow-xl space-y-4">
            <h3 className="font-serif text-base font-bold text-red-700">Delete Product?</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete this remedy from Supabase? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onUpdateStatus={handleUpdateOrderStatus}
        onOpenSlip={(ord) => setSlipOrder(ord)}
      />

      {/* Printable Delivery Packing Slip & Invoice Modal */}
      <OrderSlipModal
        isOpen={!!slipOrder}
        onClose={() => setSlipOrder(null)}
        order={slipOrder}
      />

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        onSelectOrder={(orderId) => {
          const match = orders.find((o) => o.id === orderId);
          if (match) setSelectedOrder(match);
        }}
      />
    </div>
  );
}
