import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  processCodOrder,
} from '../controllers/paymentController.js';

const router = express.Router();

// POST /api/payment/razorpay/create-order - Initialize Razorpay transaction
router.post('/razorpay/create-order', requireAuth, createRazorpayOrder);

// POST /api/payment/razorpay/verify - Verify Razorpay signature & finalize order
router.post('/razorpay/verify', requireAuth, verifyRazorpayPayment);

// POST /api/payment/cod - Cash on Delivery order processing
router.post('/cod', requireAuth, processCodOrder);

export default router;
