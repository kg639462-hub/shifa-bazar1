import { apiRequest } from './client';

export async function createRazorpayOrder(amount, currency = 'INR') {
  return await apiRequest('/payment/razorpay/create-order', {
    method: 'POST',
    body: JSON.stringify({ amount, currency }),
  });
}

export async function verifyRazorpayPayment(payload) {
  return await apiRequest('/payment/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function processCodOrder(orderDetails) {
  return await apiRequest('/payment/cod', {
    method: 'POST',
    body: JSON.stringify({ orderDetails }),
  });
}
