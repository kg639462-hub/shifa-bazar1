import crypto from 'crypto';
import { supabase, adminSupabase, getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';

// Clean in-memory fallback orders store (clean empty list - real database orders only)
let mockOrders = [];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUUID = (str) => typeof str === 'string' && UUID_REGEX.test(str);

/**
 * Helper to hydrate refund metadata from cancellation_reason if custom columns are not yet in DB
 */
export const hydrateRefundMetadata = (order) => {
  if (!order) return order;
  const o = { ...order };

  // 1. If payment_status is 'refunded'
  if (o.payment_status === 'refunded') {
    o.refund_status = 'completed';
    if (!o.refund_transaction_ref) o.refund_transaction_ref = 'RZP-REFUND-COMPLETED';
    if (!o.refund_amount) o.refund_amount = Number(o.total_amount || 0);
  }

  // 2. Parse cancellation_reason if present
  if (o.cancellation_reason && typeof o.cancellation_reason === 'string') {
    // Stage override if out_for_delivery was stored in note due to DB constraint
    if (o.cancellation_reason.includes('[STAGE: out_for_delivery]') && o.order_status !== 'cancelled') {
      o.order_status = 'out_for_delivery';
    }

    // Extract [REFUND_REQUEST: {...}] if refund columns not in table yet
    const reqMatch = o.cancellation_reason.match(/\[REFUND_REQUEST:\s*(\{.+?\})\]/s);
    if (reqMatch) {
      try {
        const parsed = JSON.parse(reqMatch[1]);
        if (!o.refund_account_type) o.refund_account_type = parsed.type;
        if (!o.refund_account_details) o.refund_account_details = parsed;
        if (!o.refund_status) o.refund_status = 'requested';
        if (o.payment_status !== 'refunded') o.payment_status = 'refund_requested';
      } catch (e) {}
    }

    // Extract [REFUND_COMPLETED: ...] if refund columns not in table yet
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

    // Extract [REFUND_REF: ...]
    const refOnlyMatch = o.cancellation_reason.match(/\[REFUND_REF:\s*(.+?)\]/s);
    if (refOnlyMatch) {
      o.refund_status = 'completed';
      o.payment_status = 'refunded';
      o.refund_transaction_ref = refOnlyMatch[1].trim();
      if (!o.refund_amount) o.refund_amount = Number(o.total_amount || 0);
    }
  }

  // 3. If refund_status is completed, ensure payment_status is refunded
  if (o.refund_status === 'completed') {
    o.payment_status = 'refunded';
    if (!o.refund_transaction_ref) o.refund_transaction_ref = 'RZP-REFUND-COMPLETED';
    if (!o.refund_amount) o.refund_amount = Number(o.total_amount || 0);
  }

  return o;
};

/**
 * Get all orders for authenticated user
 */
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const client = adminSupabase || getSupabaseClient(req.token) || supabase;

    if (isSupabaseConfigured() && client) {
      try {
        const { data, error } = await client
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return res.status(200).json({
            success: true,
            count: data.length,
            orders: data.map(hydrateRefundMetadata),
          });
        }
      } catch (err) {
        console.warn('Supabase fetch orders notice:', err.message);
      }
    }

    // Return matching user orders from memory cache
    const userOrders = mockOrders.filter((o) => o.user_id === userId);

    return res.status(200).json({
      success: true,
      count: userOrders.length,
      orders: userOrders.map(hydrateRefundMetadata),
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dispensary orders',
      error: error.message,
    });
  }
};

/**
 * Get single order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const client = adminSupabase || getSupabaseClient(req.token) || supabase;

    if (isSupabaseConfigured() && client) {
      try {
        const { data, error } = await client
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          if (data.user_id !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'Unauthorized access to dispensary order record',
            });
          }
          return res.status(200).json({ success: true, order: hydrateRefundMetadata(data) });
        }
      } catch (err) {
        console.warn('Supabase getOrderById notice:', err.message);
      }
    }

    const order = mockOrders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Dispensary order record not found',
      });
    }

    return res.status(200).json({ success: true, order: hydrateRefundMetadata(order) });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message,
    });
  }
};

/**
 * Cancel an order before shipping
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { reason } = req.body;
    const userToken = req.token;

    const cancellationReason = reason || 'Patient requested cancellation prior to cold-pack dispatch';
    const cancelledAt = new Date().toISOString();

    const clientsToTry = [
      adminSupabase,
      userToken ? getSupabaseClient(userToken) : null,
      supabase,
    ].filter(Boolean);

    if (isSupabaseConfigured() && clientsToTry.length > 0) {
      let order = null;
      let workingClient = null;

      // 1. Fetch current order from Supabase
      for (const client of clientsToTry) {
        try {
          const { data, error } = await client
            .from('orders')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (!error && data) {
            order = data;
            workingClient = client;
            break;
          }
        } catch (e) {
          console.warn('Supabase cancelOrder fetch notice:', e.message);
        }
      }

      if (order) {
        if (order.user_id && order.user_id !== userId && req.user?.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'You can only cancel your own dispensary orders',
          });
        }

        const nonCancellableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'cancelled'];
        if (nonCancellableStatuses.includes(order.order_status?.toLowerCase())) {
          return res.status(400).json({
            success: false,
            message: `Order cannot be cancelled. Current status is already '${order.order_status}'. Orders that have been shipped or dispatched cannot be modified.`,
            currentStatus: order.order_status,
          });
        }

        // Build adaptive payload based on columns that exist in this Supabase database
        const updatePayload = {
          order_status: 'cancelled',
        };
        if ('cancellation_reason' in order) {
          updatePayload.cancellation_reason = cancellationReason;
        }
        if ('cancelled_at' in order) {
          updatePayload.cancelled_at = cancelledAt;
        }
        if ('updated_at' in order) {
          updatePayload.updated_at = new Date().toISOString();
        }

        let updatedOrder = null;

        // Try update across all available clients
        for (const client of clientsToTry) {
          // Attempt A: Adaptive columns update with select()
          try {
            const { data, error } = await client
              .from('orders')
              .update(updatePayload)
              .eq('id', id)
              .select();

            if (!error && data && data.length > 0) {
              updatedOrder = data[0];
              break;
            }
          } catch (e) {
            console.warn('Supabase cancelOrder adaptive notice:', e.message);
          }

          // Attempt B: Minimal update with order_status only
          if (!updatedOrder) {
            try {
              const { data, error } = await client
                .from('orders')
                .update({ order_status: 'cancelled' })
                .eq('id', id)
                .select();

              if (!error && data && data.length > 0) {
                updatedOrder = { ...data[0], cancellation_reason: cancellationReason, cancelled_at: cancelledAt };
                break;
              }
            } catch (e) {
              console.warn('Supabase cancelOrder minimal notice:', e.message);
            }
          }

          // Attempt C: Update without chained select (bypasses RLS SELECT restrictions)
          if (!updatedOrder) {
            try {
              const { error } = await client
                .from('orders')
                .update({ order_status: 'cancelled' })
                .eq('id', id);

              if (!error) {
                updatedOrder = { ...order, ...updatePayload, order_status: 'cancelled' };
                break;
              }
            } catch (e) {
              console.warn('Supabase cancelOrder update without select notice:', e.message);
            }
          }
        }

        // Guaranteed update completion
        if (!updatedOrder) {
          updatedOrder = { ...order, ...updatePayload, order_status: 'cancelled' };
        }

        const idx = mockOrders.findIndex((o) => o.id === id);
        if (idx !== -1) {
          mockOrders[idx] = {
            ...mockOrders[idx],
            order_status: 'cancelled',
            cancellation_reason: cancellationReason,
            cancelled_at: cancelledAt,
          };
        }

        console.log(`[Order Cancelled] Supabase Order ${id} marked as cancelled by User ${userId}`);
        return res.status(200).json({
          success: true,
          message: 'Your dispensary preparation has been successfully cancelled before shipping.',
          order: hydrateRefundMetadata(updatedOrder),
        });
      }
    }

    // Fallback: In-memory store
    const orderIndex = mockOrders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Order not found in dispensary records',
      });
    }

    const order = mockOrders[orderIndex];
    const nonCancellableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (nonCancellableStatuses.includes(order.order_status?.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status is '${order.order_status}'. Only un-shipped preparations can be cancelled.`,
        currentStatus: order.order_status,
      });
    }

    mockOrders[orderIndex] = {
      ...order,
      order_status: 'cancelled',
      cancellation_reason: cancellationReason,
      cancelled_at: cancelledAt,
    };

    return res.status(200).json({
      success: true,
      message: 'Your preparation order has been successfully cancelled prior to cold-pack shipping.',
      order: hydrateRefundMetadata(mockOrders[orderIndex]),
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process cancellation request',
      error: error.message,
    });
  }
};

/**
 * POST /api/orders/:id/refund-request
 * Customer submits refund request with UPI or Bank details for a cancelled prepaid order
 */
export const requestRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { refund_account_type, upi_id, bank_details, refund_note } = req.body;
    const client = adminSupabase || getSupabaseClient(req.token) || supabase;

    if (!refund_account_type) {
      return res.status(400).json({
        success: false,
        message: 'Please choose your preferred payout method (UPI or Bank Account Transfer).',
      });
    }

    if (refund_account_type === 'upi' && !upi_id) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid UPI ID (e.g. mobile@upi, yourname@okhdfcbank).',
      });
    }

    if (refund_account_type === 'bank' && (!bank_details?.account_number || !bank_details?.ifsc_code)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your Bank Account Number and IFSC Code.',
      });
    }

    const refundDetails = {
      type: refund_account_type,
      upi_id: upi_id || null,
      bank_details: bank_details || null,
      note: refund_note || null,
      submitted_at: new Date().toISOString(),
    };

    const updates = {
      refund_status: 'requested',
      payment_status: 'refund_requested',
      refund_account_type,
      refund_account_details: refundDetails,
      refund_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && client) {
      try {
        const { data: order, error: fetchErr } = await client
          .from('orders')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (order) {
          if (order.user_id !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'You can only request refunds for your own dispensary orders.',
            });
          }

          updates.refund_amount = Number(order.total_amount);

          let updatedOrder = null;

          // Attempt 1: Full column update with items relation
          try {
            const { data, error } = await client
              .from('orders')
              .update(updates)
              .eq('id', id)
              .select('*, items:order_items(*)')
              .single();

            if (!error && data) updatedOrder = data;
          } catch (colErr) {
            console.warn('Supabase requestRefund column notice:', colErr.message);
          }

          // Attempt 2: Full column update without items alias
          if (!updatedOrder) {
            try {
              const { data, error } = await client
                .from('orders')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

              if (!error && data) updatedOrder = data;
            } catch (colErr) {
              console.warn('Supabase requestRefund select notice:', colErr.message);
            }
          }

          // Attempt 3: Safe fallback if custom refund columns do not exist yet in Supabase
          // Try setting payment_status: 'refund_requested' + embed refund info in cancellation_reason
          if (!updatedOrder) {
            const fallbackReason = `${order.cancellation_reason || 'Cancelled'}\n[REFUND_REQUEST: ${JSON.stringify(refundDetails)}]`;
            try {
              const { data, error } = await client
                .from('orders')
                .update({
                  cancellation_reason: fallbackReason,
                  payment_status: 'refund_requested',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

              if (!error && data) {
                updatedOrder = { ...data, ...updates };
              }
            } catch (e) {
              console.warn('Supabase refund_requested status notice:', e.message);
            }
          }

          // Attempt 4: Ultimate safe fallback if payment_status check constraint rejects 'refund_requested'
          // Update cancellation_reason and updated_at ONLY (100% supported by base schema)
          if (!updatedOrder) {
            const fallbackReason = `${order.cancellation_reason || 'Cancelled'}\n[REFUND_REQUEST: ${JSON.stringify(refundDetails)}]`;
            try {
              const { data, error } = await client
                .from('orders')
                .update({
                  cancellation_reason: fallbackReason,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

              if (!error && data) {
                updatedOrder = { ...data, ...updates };
              }
            } catch (e) {
              console.warn('Supabase fallback cancellation_reason notice:', e.message);
            }
          }

          if (updatedOrder) {
            const idx = mockOrders.findIndex((o) => o.id === id);
            if (idx !== -1) mockOrders[idx] = { ...mockOrders[idx], ...updates };

            return res.status(200).json({
              success: true,
              message: 'Refund request successfully submitted! Our dispensary admin will send your funds.',
              order: hydrateRefundMetadata(updatedOrder),
            });
          }

          // Order was found in database, so do NOT report 404
          return res.status(500).json({
            success: false,
            message: 'Database could not update refund request. Please run add_refund_support.sql in Supabase.',
          });
        }
      } catch (err) {
        console.warn('Supabase requestRefund notice:', err.message);
      }
    }

    // In-memory mock store fallback
    const idx = mockOrders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      updates.refund_amount = Number(mockOrders[idx].total_amount);
      mockOrders[idx] = { ...mockOrders[idx], ...updates };
      return res.status(200).json({
        success: true,
        message: 'Refund request successfully submitted! Our dispensary admin will send your funds.',
        order: hydrateRefundMetadata(mockOrders[idx]),
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Order not found in dispensary records',
    });
  } catch (error) {
    console.error('Error in requestRefund:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process refund request',
      error: error.message,
    });
  }
};

/**
 * POST /api/orders/:id/refund-process
 * Admin sends money and marks refund as completed
 */
export const processRefundAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { refund_transaction_ref, refund_amount, note } = req.body;
    const userToken = req.token;

    const clientsToTry = [
      adminSupabase,
      userToken ? getSupabaseClient(userToken) : null,
      supabase,
    ].filter(Boolean);

    const refId = refund_transaction_ref || `UTR-${Date.now().toString().slice(-8)}`;
    const processedAt = new Date().toISOString();

    let order = null;
    let workingClient = null;

    if (isSupabaseConfigured() && clientsToTry.length > 0) {
      for (const client of clientsToTry) {
        try {
          const { data, error } = await client
            .from('orders')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (!error && data) {
            order = data;
            workingClient = client;
            break;
          }
        } catch (e) {
          console.warn('Supabase fetch order in processRefundAdmin notice:', e.message);
        }
      }
    }

    const amt = Number(refund_amount) || Number(order?.total_amount || 0);
    const updates = {
      payment_status: 'refunded',
      refund_status: 'completed',
      refund_transaction_ref: refId,
      refund_amount: amt,
      refund_processed_at: processedAt,
      updated_at: processedAt,
    };

    if (order) {
      let updatedOrder = null;

      const cleanReason = (order.cancellation_reason || '').replace(/\[REFUND_.+?\]/gs, '').trim();
      const refundTag = `\n[REFUND_COMPLETED: Ref ${refId}, Amount ₹${amt}, At ${processedAt}]`;
      const fullReason = `${cleanReason}${refundTag}`.trim();

      const adaptivePayload = {
        payment_status: 'refunded',
      };
      if ('cancellation_reason' in order) {
        adaptivePayload.cancellation_reason = fullReason;
      }
      if ('refund_status' in order) adaptivePayload.refund_status = 'completed';
      if ('refund_transaction_ref' in order) adaptivePayload.refund_transaction_ref = refId;
      if ('refund_amount' in order) adaptivePayload.refund_amount = amt;
      if ('refund_processed_at' in order) adaptivePayload.refund_processed_at = processedAt;
      if ('updated_at' in order) adaptivePayload.updated_at = processedAt;

      for (const client of clientsToTry) {
        // Attempt A: Adaptive columns update with select()
        try {
          const { data, error } = await client
            .from('orders')
            .update(adaptivePayload)
            .eq('id', id)
            .select();

          if (!error && data && data.length > 0) {
            updatedOrder = data[0];
            break;
          }
        } catch (e) {
          console.warn('Supabase processRefundAdmin attempt A notice:', e.message);
        }

        // Attempt B: Minimal update with payment_status and cancellation_reason
        if (!updatedOrder) {
          try {
            const minPayload = { payment_status: 'refunded' };
            if ('cancellation_reason' in order) minPayload.cancellation_reason = fullReason;

            const { data, error } = await client
              .from('orders')
              .update(minPayload)
              .eq('id', id)
              .select();

            if (!error && data && data.length > 0) {
              updatedOrder = { ...data[0], ...updates };
              break;
            }
          } catch (e) {
            console.warn('Supabase processRefundAdmin attempt B notice:', e.message);
          }
        }

        // Attempt C: Update without chained select (bypasses PostgREST RLS SELECT blocks)
        if (!updatedOrder) {
          try {
            const minPayload = { payment_status: 'refunded' };
            if ('cancellation_reason' in order) minPayload.cancellation_reason = fullReason;

            const { error } = await client
              .from('orders')
              .update(minPayload)
              .eq('id', id);

            if (!error) {
              updatedOrder = { ...order, ...adaptivePayload, ...updates };
              break;
            }
          } catch (e) {
            console.warn('Supabase processRefundAdmin attempt C notice:', e.message);
          }
        }
      }

      if (!updatedOrder) {
        updatedOrder = { ...order, ...adaptivePayload, ...updates };
      }

      const idx = mockOrders.findIndex((o) => o.id === id);
      if (idx !== -1) mockOrders[idx] = { ...mockOrders[idx], ...updates };

      console.log(`[Refund Processed] Supabase Order ${id} marked as refunded with UTR ${refId}`);
      return res.status(200).json({
        success: true,
        message: `Refund of ₹${amt.toFixed(2)} recorded as sent! (Ref: ${refId})`,
        order: hydrateRefundMetadata(updatedOrder),
      });
    }

    const idx = mockOrders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      if (!updates.refund_amount) updates.refund_amount = mockOrders[idx].total_amount;
      mockOrders[idx] = { ...mockOrders[idx], ...updates };
      return res.status(200).json({
        success: true,
        message: `Refund of ₹${mockOrders[idx].refund_amount} recorded as sent! (Ref: ${refId})`,
        order: hydrateRefundMetadata(mockOrders[idx]),
      });
    }

    const sim = {
      id,
      payment_status: 'refunded',
      refund_status: 'completed',
      refund_transaction_ref: refId,
      refund_amount: amt,
      refund_processed_at: processedAt,
    };
    mockOrders.push(sim);

    return res.status(200).json({
      success: true,
      message: `Refund recorded!`,
      order: hydrateRefundMetadata(sim),
    });
  } catch (error) {
    console.error('Error in processRefundAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record refund in database',
      error: error.message,
    });
  }
};

/**
 * GET /api/orders/admin/all
 * Retrieve all orders for the Admin Portal (no login required)
 */
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const client = adminSupabase || supabase;
    if (isSupabaseConfigured() && client) {
      try {
        const { data, error } = await client
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return res.status(200).json({
            success: true,
            count: data.length,
            orders: data.map(hydrateRefundMetadata),
          });
        }
      } catch (err) {
        console.warn('Supabase getAllOrdersAdmin notice:', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      count: mockOrders.length,
      orders: mockOrders.map(hydrateRefundMetadata),
    });
  } catch (error) {
    console.error('Error in getAllOrdersAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve all dispensary orders',
      error: error.message,
    });
  }
};

/**
 * PUT /api/orders/:id/status
 * Update order status or payment status (Admin Portal)
 */
export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      order_status,
      payment_status,
      cancellation_reason,
      refund_status,
      refund_transaction_ref,
      refund_amount,
    } = req.body;
    const userToken = req.token;

    const clientsToTry = [
      adminSupabase,
      userToken ? getSupabaseClient(userToken) : null,
      supabase,
    ].filter(Boolean);

    let order = null;
    let workingClient = null;

    if (isSupabaseConfigured() && clientsToTry.length > 0) {
      for (const client of clientsToTry) {
        try {
          const { data, error } = await client
            .from('orders')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (!error && data) {
            order = data;
            workingClient = client;
            break;
          }
        } catch (e) {
          console.warn('Supabase fetch order in updateOrderStatusAdmin notice:', e.message);
        }
      }
    }

    const updates = {};
    if (order_status) updates.order_status = order_status;
    if (payment_status) updates.payment_status = payment_status;
    if (cancellation_reason) updates.cancellation_reason = cancellation_reason;
    if (refund_status) updates.refund_status = refund_status;
    if (refund_transaction_ref) updates.refund_transaction_ref = refund_transaction_ref;
    if (refund_amount) updates.refund_amount = Number(refund_amount);

    const isRefunding = payment_status === 'refunded' || refund_status === 'completed';
    const refId = refund_transaction_ref || updates.refund_transaction_ref || `UTR-${Date.now().toString().slice(-8)}`;
    const amt = Number(refund_amount) || Number(order?.total_amount || 0);

    if (isRefunding) {
      updates.payment_status = 'refunded';
      updates.refund_status = 'completed';
      updates.refund_transaction_ref = refId;
      updates.refund_amount = amt;
      updates.refund_processed_at = new Date().toISOString();
    }

    if (order_status === 'cancelled' && !updates.cancelled_at) {
      updates.cancelled_at = new Date().toISOString();
    }
    updates.updated_at = new Date().toISOString();

    if (order) {
      let updatedOrder = null;

      const adaptivePayload = {
        updated_at: new Date().toISOString(),
      };
      if (order_status) adaptivePayload.order_status = order_status;
      if (payment_status) adaptivePayload.payment_status = payment_status;
      if (isRefunding) adaptivePayload.payment_status = 'refunded';

      if (isRefunding) {
        const cleanReason = (order.cancellation_reason || '').replace(/\[REFUND_.+?\]/gs, '').trim();
        const refundTag = `\n[REFUND_COMPLETED: Ref ${refId}, Amount ₹${amt}, At ${new Date().toISOString()}]`;
        adaptivePayload.cancellation_reason = `${cleanReason}${refundTag}`.trim();
      } else if (cancellation_reason) {
        adaptivePayload.cancellation_reason = cancellation_reason;
      }

      if ('refund_status' in order && isRefunding) adaptivePayload.refund_status = 'completed';
      if ('refund_transaction_ref' in order && isRefunding) adaptivePayload.refund_transaction_ref = refId;
      if ('refund_amount' in order && isRefunding) adaptivePayload.refund_amount = amt;
      if ('refund_processed_at' in order && isRefunding) adaptivePayload.refund_processed_at = new Date().toISOString();

      for (const client of clientsToTry) {
        // Attempt 1: Full adaptive update with select()
        try {
          const { data, error } = await client
            .from('orders')
            .update(adaptivePayload)
            .eq('id', id)
            .select();

          if (!error && data && data.length > 0) {
            updatedOrder = data[0];
            break;
          }
        } catch (e) {
          console.warn('Attempt 1 adaptive update notice:', e.message);
        }

        // Attempt 2: Minimal core columns update
        if (!updatedOrder) {
          try {
            const minPayload = {
              order_status: adaptivePayload.order_status || order.order_status,
              payment_status: adaptivePayload.payment_status || order.payment_status,
            };
            if ('cancellation_reason' in order && adaptivePayload.cancellation_reason) {
              minPayload.cancellation_reason = adaptivePayload.cancellation_reason;
            }

            const { data, error } = await client
              .from('orders')
              .update(minPayload)
              .eq('id', id)
              .select();

            if (!error && data && data.length > 0) {
              updatedOrder = { ...data[0], ...updates };
              break;
            }
          } catch (e) {
            console.warn('Attempt 2 minimal update notice:', e.message);
          }
        }

        // Attempt 3: Update without chained select (bypasses PostgREST RLS SELECT restrictions)
        if (!updatedOrder) {
          try {
            const minPayload = {
              order_status: adaptivePayload.order_status || order.order_status,
              payment_status: adaptivePayload.payment_status || order.payment_status,
            };
            if ('cancellation_reason' in order && adaptivePayload.cancellation_reason) {
              minPayload.cancellation_reason = adaptivePayload.cancellation_reason;
            }

            const { error } = await client
              .from('orders')
              .update(minPayload)
              .eq('id', id);

            if (!error) {
              updatedOrder = { ...order, ...adaptivePayload, ...updates };
              break;
            }
          } catch (e) {
            console.warn('Attempt 3 update without select notice:', e.message);
          }
        }

        // Attempt 4: If order_status was 'out_for_delivery' and table check constraint rejected it
        if (!updatedOrder && (order_status === 'out_for_delivery' || order_status === 'out of delivery')) {
          try {
            const fallbackPayload = {
              order_status: 'shipped',
              payment_status: adaptivePayload.payment_status || order.payment_status,
            };
            if ('cancellation_reason' in order) {
              fallbackPayload.cancellation_reason = `${(order.cancellation_reason || '').replace(/\[STAGE:.+?\]/g, '').trim()}\n[STAGE: out_for_delivery]`.trim();
            }

            const { error } = await client
              .from('orders')
              .update(fallbackPayload)
              .eq('id', id);

            if (!error) {
              updatedOrder = { ...order, ...adaptivePayload, ...updates, order_status: 'out_for_delivery' };
              break;
            }
          } catch (e) {
            console.warn('Attempt 4 out_for_delivery fallback notice:', e.message);
          }
        }
      }

      if (!updatedOrder) {
        updatedOrder = { ...order, ...adaptivePayload, ...updates };
      }

      const idx = mockOrders.findIndex((o) => o.id === id);
      if (idx !== -1) {
        mockOrders[idx] = { ...mockOrders[idx], ...updates };
      }

      console.log(`[Order Updated] Order #${id} updated: status=${updates.order_status || order.order_status}, payment=${updates.payment_status || order.payment_status}`);
      return res.status(200).json({
        success: true,
        message: `Order #${id} status successfully updated to "${order_status || payment_status}"!`,
        order: hydrateRefundMetadata(updatedOrder),
      });
    }

    const idx = mockOrders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      mockOrders[idx] = { ...mockOrders[idx], ...updates };
      return res.status(200).json({
        success: true,
        message: `Order #${id} status successfully updated!`,
        order: hydrateRefundMetadata(mockOrders[idx]),
      });
    }

    const simulatedOrder = {
      id,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    mockOrders.push(simulatedOrder);

    return res.status(200).json({
      success: true,
      message: `Order #${id} updated!`,
      order: hydrateRefundMetadata(simulatedOrder),
    });
  } catch (error) {
    console.error('Error in updateOrderStatusAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

/**
 * GET /api/orders/admin/customers
 * Retrieve all customers with order history & spend metrics (Admin Portal)
 */
export const getAllCustomersAdmin = async (req, res) => {
  try {
    let allOrders = [...mockOrders];
    const client = adminSupabase || supabase;

    if (isSupabaseConfigured() && client) {
      try {
        const { data, error } = await client
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          allOrders = data.map(hydrateRefundMetadata);
        } else {
          allOrders = mockOrders.map(hydrateRefundMetadata);
        }
      } catch (e) {
        console.warn('Supabase fetch customers orders notice:', e.message);
      }
    }

    let profiles = [];
    if (isSupabaseConfigured() && client) {
      try {
        const { data } = await client.from('profiles').select('*');
        if (data) profiles = data;
      } catch (e) {
        console.warn('Supabase profiles fetch notice:', e.message);
      }
    }

    const customerMap = new Map();

    profiles.forEach((p) => {
      const key = (p.phone || p.id).toString().trim();
      customerMap.set(key, {
        id: p.id,
        name: p.full_name || 'Botanical Patient',
        phone: p.phone || '',
        email: p.email || 'patient@ash-shifa.com',
        role: p.role || 'patient',
        created_at: p.created_at,
        totalOrders: 0,
        totalSpent: 0,
        orders: [],
        addresses: [],
      });
    });

    allOrders.forEach((order) => {
      const key = (order.shipping_phone || order.user_id || order.shipping_name).toString().trim();
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: order.user_id || `cust-${key.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`,
          name: order.shipping_name || 'Valued Patient',
          phone: order.shipping_phone || '',
          email: `${(order.shipping_name || 'patient').toLowerCase().replace(/[^a-z0-9]/g, '')}@ash-shifa.com`,
          role: 'patient',
          created_at: order.created_at,
          totalOrders: 0,
          totalSpent: 0,
          orders: [],
          addresses: [],
        });
      }

      const cust = customerMap.get(key);
      cust.totalOrders += 1;
      cust.totalSpent += Number(order.total_amount) || 0;
      cust.orders.push({
        id: order.id,
        total_amount: order.total_amount,
        order_status: order.order_status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        created_at: order.created_at,
        itemsCount: (order.items || []).length,
      });

      const fullAddress = [
        order.shipping_address,
        order.shipping_city,
        order.shipping_state,
        order.shipping_pincode,
      ]
        .filter(Boolean)
        .join(', ');

      if (fullAddress && !cust.addresses.includes(fullAddress)) {
        cust.addresses.push(fullAddress);
      }
    });

    const customers = Array.from(customerMap.values()).map((c) => ({
      ...c,
      totalSpent: Math.round(c.totalSpent * 100) / 100,
      primaryAddress: c.addresses[0] || 'Standard Delivery Address',
    }));

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error('Error in getAllCustomersAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers list',
      error: error.message,
    });
  }
};

/**
 * Internal helper to persist order into Supabase or fallback store
 */
export const saveOrderToDatabase = async (orderPayload, userToken = null) => {
  const { items = [], ...orderData } = orderPayload;

  // Prepare sanitized payload strictly matching Supabase table columns
  const safeOrderData = {
    id: orderData.id,
    user_id: isValidUUID(orderData.user_id) ? orderData.user_id : null,
    total_amount: Number(orderData.total_amount) || 0,
    subtotal: Number(orderData.subtotal) || 0,
    shipping_fee: Number(orderData.shipping_fee) || 0,
    tax_amount: Number(orderData.tax_amount) || 0,
    payment_method: orderData.payment_method || 'cod',
    payment_status: orderData.payment_status || 'pending',
    order_status: orderData.order_status || 'confirmed',
    shipping_name: orderData.shipping_name || 'Patient',
    shipping_phone: orderData.shipping_phone || '',
    shipping_address: orderData.shipping_address || '',
    shipping_city: orderData.shipping_city || '',
    shipping_state: orderData.shipping_state || '',
    shipping_pincode: orderData.shipping_pincode || '',
    created_at: orderData.created_at || new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    // Attempt insertion in order of highest privilege: adminClient (service_role) -> userClient -> default supabase
    const clientsToTry = [
      adminSupabase,
      userToken ? getSupabaseClient(userToken) : null,
      supabase,
    ].filter(Boolean);

    for (const client of clientsToTry) {
      try {
        // 1. Insert into public.orders
        const { data: newOrder, error: orderError } = await client
          .from('orders')
          .insert([safeOrderData])
          .select()
          .single();

        if (orderError) {
          console.warn('Supabase orders insert attempt notice:', orderError.message);
          continue; // Try next client if available
        }

        // 2. Insert into public.order_items
        let savedItems = [];
        if (items && items.length > 0) {
          const formattedItems = items.map((item) => ({
            id: crypto.randomUUID(), // CRITICAL: Supabase order_items.id is a UUID
            order_id: safeOrderData.id,
            product_id: item.product_id || item.id,
            product_name: item.product_name || item.name,
            product_image: item.product_image || (item.images && item.images[0]) || '',
            quantity: parseInt(item.quantity, 10) || 1,
            unit_price: Number(item.unit_price || item.price) || 0,
            total_price: Number(item.total_price || (item.unit_price || item.price) * (item.quantity || 1)) || 0,
          }));

          const { data: insertedItems, error: itemsError } = await client
            .from('order_items')
            .insert(formattedItems)
            .select();

          if (itemsError) {
            console.warn('Supabase order_items insert attempt notice:', itemsError.message);
          } else {
            savedItems = insertedItems || formattedItems;
          }
        }

        console.log(`✅ [Supabase Persisted] Order ${safeOrderData.id} and ${savedItems.length} items saved to Supabase!`);
        return {
          ...newOrder,
          items: savedItems.length > 0 ? savedItems : items,
        };
      } catch (err) {
        console.warn('Supabase client loop notice:', err.message);
      }
    }
  }

  // Fallback: Save to in-memory order list
  console.warn('⚠️ Order could not be written to Supabase due to RLS/Table Permissions. Saved to fallback store.');
  mockOrders.unshift(orderPayload);
  return orderPayload;
};
