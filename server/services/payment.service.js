/**
 * Mock payment service.
 * 
 * SEAM: This is the exact boundary where a real payment gateway (Stripe, Braintree, etc.)
 * is integrated. By isolating this logic, we guarantee that swapping in a real gateway
 * later touches only this file, keeping the controllers completely untouched.
 */
async function processPayment({ amount, userId, eventId }) {
  // Simulate network delay to the mock payment processor
  await new Promise((resolve) => setTimeout(resolve, 100));

  // In a real integration, this would create a PaymentIntent, charge a source, etc.
  // We return a structured response indicating success and transaction details.
  return {
    success: true,
    transactionId: `mock_tx_${Date.now()}_${userId.slice(-6)}`,
    amount,
    currency: "USD",
  };
}

module.exports = {
  processPayment,
};
