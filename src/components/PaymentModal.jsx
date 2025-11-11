import React, { useState, useEffect } from 'react';
import { ref, set, get } from 'firebase/database';
import { database } from '../firebase/firebase';
import './PaymentModal.css';

const RAZORPAY_KEY_ID = 'rzp_test_1DP5mmOlF5G5ag';
const WEIGHT_TOLERANCE = 2; // grams tolerance

const PaymentModal = ({ cart, user, onClose, onSuccess }) => {
  const [paymentMode, setPaymentMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weightValidation, setWeightValidation] = useState(null);
  const [cartTotalWeight, setCartTotalWeight] = useState(0);
  const [actualWeight, setActualWeight] = useState(0);

  // Calculate cart totals
  const calculateTotals = () => {
    const subtotal = cart.reduce((total, item) => {
      const price = item.discountPrice || item.price;
      return total + (price * item.quantity);
    }, 0);

    const tax = subtotal * 0.05; // 5% tax
    const totalAmount = subtotal + tax;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2))
    };
  };

  // Convert weight string to grams
  const parseWeight = (weightStr) => {
    if (!weightStr) return 0;
    
    const str = String(weightStr).toLowerCase();
    
    // Handle "500g", "1kg", "12 eggs", etc.
    if (str.includes('kg')) {
      const kg = parseFloat(str.replace(/[^\d.]/g, ''));
      return kg * 1000; // Convert to grams
    } else if (str.includes('g')) {
      return parseFloat(str.replace(/[^\d.]/g, ''));
    } else if (str.includes('ml') || str.includes('l')) {
      // Treat liquids as weight (1ml ≈ 1g for most liquids)
      if (str.includes('ml')) {
        return parseFloat(str.replace(/[^\d.]/g, ''));
      } else {
        const liters = parseFloat(str.replace(/[^\d.]/g, ''));
        return liters * 1000;
      }
    } else if (str.includes('egg')) {
      // Assume 1 egg ≈ 50g
      const count = parseFloat(str.replace(/[^\d.]/g, ''));
      return count * 50;
    } else {
      // Try to parse as number (assume grams)
      const num = parseFloat(str.replace(/[^\d.]/g, ''));
      return isNaN(num) ? 0 : num;
    }
  };

  // Validate weight
  useEffect(() => {
    const validateWeight = async () => {
      try {
        // Get cart weight from Firebase Product_Weight (calculated weight of scanned items)
        const productWeightRef = ref(database, 'Shopping_Basket/Product_Weight');
        const productWeightSnapshot = await get(productWeightRef);
        const cartWeightFromFirebase = parseFloat(productWeightSnapshot.val()) || 0;

        setCartTotalWeight(cartWeightFromFirebase);

        // Get actual weight from hardware (Shopping_Basket/Weight)
        const weightRef = ref(database, 'Shopping_Basket/Weight');
        const weightSnapshot = await get(weightRef);
        const actualWeightGrams = parseFloat(weightSnapshot.val()) || 0;
        
        setActualWeight(actualWeightGrams);

        // Check if weights match within tolerance
        const difference = Math.abs(cartWeightFromFirebase - actualWeightGrams);
        const isValid = difference <= WEIGHT_TOLERANCE;

        setWeightValidation({
          isValid,
          difference,
          cartWeight: cartWeightFromFirebase,
          actualWeight: actualWeightGrams
        });

        console.log('Weight Validation:', {
          cartWeight: cartWeightFromFirebase,
          actualWeight: actualWeightGrams,
          difference,
          isValid,
          tolerance: WEIGHT_TOLERANCE
        });

      } catch (error) {
        console.error('Weight validation error:', error);
      }
    };

    validateWeight();
  }, [cart]);

  const { subtotal, tax, totalAmount } = calculateTotals();

  // Handle Razorpay payment
  const handleOnlinePayment = () => {
    if (!weightValidation?.isValid) {
      alert('❌ Weight validation failed! Cannot proceed with payment.');
      return;
    }

    setLoading(true);

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(totalAmount * 100), // Amount in paise
      currency: 'INR',
      name: 'Shopping Basket',
      description: `Order for ${cart.length} items`,
      image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
      handler: async function (response) {
        console.log('Payment successful:', response);
        await createOrder('Online', response.razorpay_payment_id);
      },
      prefill: {
        name: user.fullName || '',
        email: user.email || '',
        contact: user.phone || ''
      },
      theme: {
        color: '#667eea'
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      alert('Payment failed! Please try again.');
      setLoading(false);
    });

    razorpay.open();
  };

  // Handle offline (cash) payment
  const handleOfflinePayment = async () => {
    if (!weightValidation?.isValid) {
      alert('❌ Weight validation failed! Cannot proceed with payment.');
      return;
    }

    const confirm = window.confirm(
      `💵 Cash Payment: ₹${totalAmount}\n\n` +
      `Admin will collect the cash.\n` +
      `Proceed with offline payment?`
    );

    if (confirm) {
      setLoading(true);
      await createOrder('Offline (Cash)', 'CASH_PAYMENT');
    }
  };

  // Create order in Firebase
  const createOrder = async (paymentMethod, paymentId) => {
    try {
      const orderNumber = `ORD-${Date.now()}`;
      
      const orderData = {
        orderNumber,
        customerId: user.customerId || 'GUEST',
        customerName: user.fullName || user.email,
        customerEmail: user.email,
        items: cart.map(item => ({
          id: item.id,
          title: item.title,
          price: item.discountPrice || item.price,
          quantity: item.quantity,
          weight: item.weight
        })),
        subtotal,
        tax,
        totalAmount,
        paymentMethod,
        paymentId,
        paymentStatus: 'Completed',
        weightValidation: {
          cartWeight: weightValidation.cartWeight,
          actualWeight: weightValidation.actualWeight,
          difference: weightValidation.difference,
          isValid: weightValidation.isValid
        },
        createdAt: new Date().toISOString()
      };

      // Save to orders
      await set(ref(database, `Shopping_Basket/orders/${orderNumber}`), orderData);

      // Save to user's purchase history
      await set(ref(database, `Shopping_Basket/users/${user.uid}/purchases/${orderNumber}`), {
        orderNumber,
        totalAmount,
        paymentMethod,
        createdAt: orderData.createdAt
      });

      // Clear cart
      await set(ref(database, `Shopping_Basket/carts/${user.uid}`), {
        items: [],
        updatedAt: new Date().toISOString()
      });

      setLoading(false);
      
      // Show success message
      alert(
        `✅ Order Successful!\n\n` +
        `Order: ${orderNumber}\n` +
        `Amount: ₹${totalAmount}\n` +
        `Payment: ${paymentMethod}\n\n` +
        `Thank you for shopping!`
      );

      onSuccess(orderData);
      onClose();

    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-container">
        <div className="payment-modal-header">
          <h2>💳 Complete Payment</h2>
          <button className="close-payment-btn" onClick={onClose}>✕</button>
        </div>

        <div className="payment-modal-content">
          {/* Weight Validation Section */}
          <div className={`weight-validation ${weightValidation?.isValid ? 'valid' : 'invalid'}`}>
            <h3>⚖️ Weight Validation</h3>
            <div className="weight-details">
              <div className="weight-row">
                <span>Cart Weight:</span>
                <strong>{cartTotalWeight.toFixed(2)}g</strong>
              </div>
              <div className="weight-row">
                <span>Actual Weight:</span>
                <strong>{actualWeight.toFixed(2)}g</strong>
              </div>
              <div className="weight-row">
                <span>Difference:</span>
                <strong>{weightValidation?.difference.toFixed(2)}g</strong>
              </div>
            </div>
            
            {weightValidation?.isValid ? (
              <div className="weight-status success">
                ✅ Weight matches! You can proceed with payment.
              </div>
            ) : (
              <div className="weight-status error">
                ❌ Weight mismatch! You are not eligible to purchase.
                <p>Please ensure all items are properly scanned.</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h3>📋 Order Summary</h3>
            <div className="summary-items">
              {cart.map((item, index) => (
                <div key={index} className="summary-item">
                  <span>{item.title} × {item.quantity}</span>
                  <span>₹{((item.discountPrice || item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax (5%):</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <strong>Total:</strong>
                <strong>₹{totalAmount.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Payment Mode Selection */}
          {!paymentMode && weightValidation?.isValid && (
            <div className="payment-mode-selection">
              <h3>Select Payment Mode</h3>
              <div className="payment-buttons">
                <button 
                  className="payment-btn online"
                  onClick={() => setPaymentMode('online')}
                  disabled={loading}
                >
                  💳 Online Payment (Razorpay)
                </button>
                <button 
                  className="payment-btn offline"
                  onClick={() => setPaymentMode('offline')}
                  disabled={loading}
                >
                  💵 Offline (Cash)
                </button>
              </div>
            </div>
          )}

          {/* Confirm Payment */}
          {paymentMode === 'online' && (
            <div className="payment-confirm">
              <button 
                className="confirm-payment-btn online"
                onClick={handleOnlinePayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Pay ₹${totalAmount} via Razorpay`}
              </button>
              <button className="back-btn" onClick={() => setPaymentMode(null)}>
                ← Back
              </button>
            </div>
          )}

          {paymentMode === 'offline' && (
            <div className="payment-confirm">
              <div className="offline-notice">
                <p>💵 Cash payment of <strong>₹{totalAmount}</strong></p>
                <p>Admin will collect the cash at checkout.</p>
              </div>
              <button 
                className="confirm-payment-btn offline"
                onClick={handleOfflinePayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Cash Payment'}
              </button>
              <button className="back-btn" onClick={() => setPaymentMode(null)}>
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
