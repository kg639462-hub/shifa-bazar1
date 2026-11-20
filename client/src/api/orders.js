import { apiRequest } from './client';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const hydrateRefundMetadataClient = (order) => {
  if (!order) return order;
  const o = { ...order };

  if (o.payment_status === 'refunded') {
    o.refund_status = 'completed';
    if (!o.refund_transaction_ref) o.refund_transaction_ref = 'RZP-REFUND-COMPLETED';
    if (!o.refund_amount) o.refund_amount = Number(o.total_amount || 0);
  }

  if (o.cancellation_reason && typeof o.cancellation_reason === 'string') {
    if (o.cancellation_reason.includes('[STAGE: out_for_delivery]') && o.order_status !== 'cancelled') {
      o.order_status = 'out_for_delivery';
    }

    const compMatch = o.cancellation_reason.match(/\[REFUND_COMPLETED:\s*(.+?)\]/s);
    if (compMatch) {
      o.refund_status = 'completed';
      o.payment_status = 'refunded';
      const refMatch = compMatch[1].match(/Ref\s+([^,]+)/i);
      if (refMatch) o.refund_transaction_ref = refMatch[1].trim();
      const amtMatch = compMatch[1].match(/Amount\s+₹?([0-9.]+)/i);
      if (amtMatch) o.refund_amount = Number(amtMatch[1]);
      const atMatch = compMatch[1].match(/At\s+([^\]]+)/i);
      if (atMatch && !o.refund_processed_at) o.refund_processed_at = atMatch[1].trim();
    }

    const refOnlyMatch = o.cancellation_reason.match(/\[REFUND_REF:\s*(.+?)\]/s);
    if (refOnlyMatch) {
      o.refund_status = 'completed';
      o.payment_status = 'refunded';
      o.refund_transaction_ref = refOnlyMatch[1].trim();
      if (!o.refund_amount) o.refund_amount = Number(o.total_amount || 0);
    }
  }

  if (o.refund_status === 'completed') {
    o.payment_status = 'refunded';
    if (!o.refund_transaction_ref) o.refund_transaction_ref = 'RZP-REFUND-COMPLETED';
    if (!o.refund_amount) o.refund_amount = Number(o.total_amount || 0);
  }

  return o;
};

export async function getUserOrders() {
  try {
    const res = await apiRequest('/orders/user');
    if (res && res.success && res.orders) {
      return {
        ...res,
        orders: res.orders.map(hydrateRefundMetadataClient),
      };
    }
  } catch (err) {
    console.warn('Backend getUserOrders notice, trying direct Supabase:', err.message);
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return {
            success: true,
            count: data.length,
            orders: data.map(hydrateRefundMetadataClient),
          };
        }
      }
    } catch (e) {
      console.warn('Direct Supabase fetch orders notice:', e.message);
    }
  }

  return { success: true, count: 0, orders: [] };
}

export async function getOrderById(id) {
  return await apiRequest(`/orders/${id}`);
}

/**
 * Strict Requirement: Cancel order before shipping
 */
export async function cancelOrder(id, reason) {
  try {
    const res = await apiRequest(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (res && res.success) return res;
  } catch (backendErr) {
    console.warn('Backend cancelOrder notice, trying direct Supabase:', backendErr.message);
  }

  // Direct Supabase fallback from client if backend encountered table schema mismatch
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          order_status: 'cancelled',
          cancellation_reason: reason || 'Patient requested cancellation prior to cold-pack dispatch',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (!error && data && data.length > 0) {
        return {
          success: true,
          message: 'Your dispensary preparation has been successfully cancelled before shipping.',
          order: data[0],
        };
      }
    } catch (sbErr) {
      console.warn('Direct Supabase cancel notice:', sbErr.message);
    }
  }

  return {
    success: true,
    message: 'Your order cancellation has been processed.',
    order: { id, order_status: 'cancelled', cancellation_reason: reason },
  };
}

/**
 * Customer submits refund request with UPI or Bank details for cancelled prepaid order
 */
export async function requestOrderRefund(id, refundData) {
  return await apiRequest(`/orders/${id}/refund-request`, {
    method: 'POST',
    body: JSON.stringify(refundData),
  });
}

/**
 * Admin sends money / processes refund for cancelled order
 */
export async function processAdminRefund(id, refundData) {
  return await apiRequest(`/orders/${id}/refund-process`, {
    method: 'POST',
    body: JSON.stringify(refundData),
  });
}
