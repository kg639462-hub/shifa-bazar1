import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  getAllCustomersAdmin,
  requestRefund,
  processRefundAdmin,
} from '../controllers/orderController.js';

const router = express.Router();

// GET /api/orders/user - Retrieve authenticated user's order history
router.get('/user', requireAuth, getUserOrders);

// Admin Portal Routes (Direct Access - No Login Required)
// GET /api/orders/admin/all - Retrieve all orders for Admin Portal
router.get('/admin/all', getAllOrdersAdmin);

// GET /api/orders/admin/customers - Retrieve all customers and analytics
router.get('/admin/customers', getAllCustomersAdmin);

// PUT /api/orders/:id/status - Update order status & payment status
router.put('/:id/status', updateOrderStatusAdmin);

// POST /api/orders/:id/refund-process - Admin sends money & marks refund complete
router.post('/:id/refund-process', processRefundAdmin);

// GET /api/orders/:id - Retrieve order details
router.get('/:id', requireAuth, getOrderById);

// POST /api/orders/:id/cancel - Strict Requirement: Order cancellation before shipping
router.post('/:id/cancel', requireAuth, cancelOrder);

// POST /api/orders/:id/refund-request - Customer submits refund request with UPI or Bank details
router.post('/:id/refund-request', requireAuth, requestRefund);

export default router;
