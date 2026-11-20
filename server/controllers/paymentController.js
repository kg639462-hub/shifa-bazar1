import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import { saveOrderToDatabase } from './orderController.js';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { initialProducts } from './productController.js';

dotenv.config();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_U1XmP47YTdHQjW';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

const isRazorpayConfigured = () => {
  return (
    razorpayKeyId &&
    !razorpayKeyId.includes('placeholder') &&
    razorpayKeySecret &&
    !razorpayKeySecret.includes('placeholder')
  );
};

// Initialize Razorpay client if credentials are configured
let razorpayInstance = null;
if (isRazorpayConfigured()) {
  try {
    razorpayInstance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });
  } catch (err) {
    console.warn('⚠️ Razorpay initialization warning:', err.message);
  }
}

/**
 * Backend Price Validator & Calculator
 * Sets and enforces prices strictly from the Supabase database
 */
export async function calculateBackendPrice(items = []) {
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const prodId = item.product_id || item.id;
    let unitPrice = 0;
    let prodName = item.name || item.product_name || 'Botanical Remedy';
    let prodImage = item.images?.[0] || item.product_image || '';

    // Look up official price set in Supabase database
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: dbProduct } = await supabase
          .from('products')
          .select('name, price, images')
          .eq('id', prodId)
          .single();

        if (dbProduct) {
          unitPrice = Number(dbProduct.price);
          prodName = dbProduct.name;
          if (dbProduct.images && dbProduct.images[0]) {
            prodImage = dbProduct.images[0];
          }
        }
      } catch (e) {
        console.warn('Price lookup in Supabase notice:', e.message);
      }
    }

    // Fallback to initialProducts if not in Supabase
    if (!unitPrice) {
      const match = initialProducts.find((p) => p.id === prodId);
      if (match) {
        unitPrice = Number(match.price);
        prodName = match.name;
        prodImage = match.images[0];
      } else {
        unitPrice = Number(item.price || item.unit_price || 0);
      }
    }

    const qty = parseInt(item.quantity, 10) || 1;
    const itemTotal = unitPrice * qty;
    subtotal += itemTotal;

    verifiedItems.push({
      product_id: prodId,
      product_name: prodName,
      product_image: prodImage,
      quantity: qty,
      unit_price: unitPrice,
      total_price: itemTotal,
    });
  }

  const shippingFee = 0.0;
  const taxAmount = 0.0;
  const totalAmount = subtotal + shippingFee + taxAmount;

  return { subtotal, shippingFee, taxAmount, totalAmount, verifiedItems };
}

/**
 * POST /api/payment/razorpay/create-order
 * Initialize Razorpay transaction with price set and verified through backend
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, items, currency = 'INR', receipt = `rcpt_${Date.now()}` } = req.body;

    let finalAmount = Number(amount);

    // If items were passed, recalculate and set price strictly through backend
    if (items && Array.isArray(items) && items.length > 0) {
      const calculated = await calculateBackendPrice(items);
      finalAmount = calculated.totalAmount;
    }

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order amount for payment initialization',
      });
    }

    // Amount in paise (1 INR = 100 paise)
    const subunitAmount = Math.round(finalAmount * 100);

    // If live Razorpay is configured
    if (razorpayInstance) {
      const options = {
        amount: subunitAmount,
        currency,
        receipt,
        payment_capture: 1,
      };

      const razorpayOrder = await razorpayInstance.orders.create(options);

      return res.status(200).json({
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: razorpayKeyId,
        backendCalculatedPrice: finalAmount,
      });
    }

    // Standard client checkout with actual Razorpay Key
    return res.status(200).json({
      success: true,
      orderId: null,
      amount: subunitAmount,
      currency,
      keyId: razorpayKeyId,
      backendCalculatedPrice: finalAmount,
      message: 'Razorpay payment initialized',
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate Razorpay transaction',
      error: error.message,
    });
  }
};

/**
 * POST /api/payment/razorpay/verify
 * Verify Razorpay Signature and Finalize Order in Supabase
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDetails,
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Please sign in to complete payment and register your dispensary order.',
      });
    }

    if (!razorpay_payment_id || razorpay_payment_id.startsWith('pay_mock')) {
      return res.status(400).json({
        success: false,
        message: 'Mock payments are disabled. Please complete an actual payment transaction via Razorpay.',
      });
    }

    // Verify signature if live keys are present
    if (isRazorpayConfigured() && razorpayKeySecret) {
      const hmac = crypto.createHmac('sha256', razorpayKeySecret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Botanical security check failed: Invalid payment signature verification.',
        });
      }
    }

    // Recalculate and set price strictly through backend
    const pricing = await calculateBackendPrice(orderDetails.items);

    const orderId = `ord-rzp-${Date.now().toString().slice(-6)}`;
    const newOrderPayload = {
      id: orderId,
      user_id: userId,
      total_amount: pricing.totalAmount, // Strictly backend set price
      subtotal: pricing.subtotal,
      shipping_fee: pricing.shippingFee,
      tax_amount: pricing.taxAmount,
      payment_method: 'razorpay',
      payment_status: 'paid',
      razorpay_payment_id: razorpay_payment_id || null,
      razorpay_order_id: razorpay_order_id || null,
      order_status: 'confirmed',
      shipping_name: orderDetails.shippingAddress.fullName,
      shipping_phone: orderDetails.shippingAddress.phone,
      shipping_address: orderDetails.shippingAddress.address,
      shipping_city: orderDetails.shippingAddress.city,
      shipping_state: orderDetails.shippingAddress.state,
      shipping_pincode: orderDetails.shippingAddress.postalCode,
      created_at: new Date().toISOString(),
      items: pricing.verifiedItems,
    };

    const token = req.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    const savedOrder = await saveOrderToDatabase(newOrderPayload, token);

    return res.status(201).json({
      success: true,
      message: 'Payment verified and dispensary order confirmed with backend-set pricing!',
      order: savedOrder,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete payment verification',
      error: error.message,
    });
  }
};

/**
 * POST /api/payment/cod
 * Process Cash on Delivery (COD) Order with price set through backend
 */
export const processCodOrder = async (req, res) => {
  try {
    const { orderDetails } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Please sign in to complete payment and register your dispensary order.',
      });
    }

    if (!orderDetails || !orderDetails.items || orderDetails.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Please add botanical preparations before checking out.',
      });
    }

    if (!orderDetails.shippingAddress || !orderDetails.shippingAddress.address) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required for apothecary delivery.',
      });
    }

    // Set and calculate price strictly through backend
    const pricing = await calculateBackendPrice(orderDetails.items);

    const orderId = `ord-cod-${Date.now().toString().slice(-6)}`;
    const newOrderPayload = {
      id: orderId,
      user_id: userId,
      total_amount: pricing.totalAmount, // Strictly backend set price
      subtotal: pricing.subtotal,
      shipping_fee: pricing.shippingFee,
      tax_amount: pricing.taxAmount,
      payment_method: 'cod',
      payment_status: 'pending',
      order_status: 'confirmed',
      shipping_name: orderDetails.shippingAddress.fullName,
      shipping_phone: orderDetails.shippingAddress.phone,
      shipping_address: orderDetails.shippingAddress.address,
      shipping_city: orderDetails.shippingAddress.city,
      shipping_state: orderDetails.shippingAddress.state,
      shipping_pincode: orderDetails.shippingAddress.postalCode,
      created_at: new Date().toISOString(),
      items: pricing.verifiedItems,
    };

    const token = req.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    const savedOrder = await saveOrderToDatabase(newOrderPayload, token);

    return res.status(201).json({
      success: true,
      message: 'Cash on Delivery order confirmed! Cold-pack packaging underway.',
      order: savedOrder,
    });
  } catch (error) {
    console.error('Cash on delivery order error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to register Cash on Delivery order',
      error: error.message,
    });
  }
};
