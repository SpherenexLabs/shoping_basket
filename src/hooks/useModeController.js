import { useEffect, useRef } from 'react';
import { ref, onValue, set, get } from 'firebase/database';
import { database } from '../firebase/firebase';

/**
 * Mode-based Cart Controller
 * Listens to Shopping_Basket/Modes and performs actions:
 * - Mode 1: Add item to cart (increment quantity)
 * - Mode 2: Remove item from cart (decrement quantity)
 * - Mode 3: Reset/Clear entire cart
 * - Mode 4: Generate bill and create order
 */

export const useModeController = (user, cart, setCart) => {
  const lastModeRef = useRef(null);
  const lastProductRef = useRef(null);

  useEffect(() => {
    if (!user || user.isAdmin) return;

    // Listen to Mode changes
    const modeRef = ref(database, 'Shopping_Basket/Modes');
    const productNameRef = ref(database, 'Shopping_Basket/Product_Name');

    const unsubscribeMode = onValue(modeRef, async (snapshot) => {
      const mode = snapshot.val();
      if (!mode || mode === lastModeRef.current) return;

      console.log('🔔 Mode changed:', mode);
      lastModeRef.current = mode;

      // Get current product name
      const productSnapshot = await get(productNameRef);
      const productName = productSnapshot.val();
      
      console.log('📦 Product Name:', productName);

      switch (mode) {
        case 1:
          await handleAddToCart(productName, cart, setCart, user);
          break;
        case 2:
          await handleRemoveFromCart(productName, cart, setCart, user);
          break;
        case 3:
          await handleResetCart(setCart, user);
          break;
        case 4:
          await handleGenerateBill(cart, user);
          break;
        default:
          console.log('Unknown mode:', mode);
      }
    });

    return () => {
      unsubscribeMode();
    };
  }, [user, cart, setCart]);
};

// Helper function to parse weight
const parseWeight = (weightStr) => {
  if (!weightStr) return 0;
  const str = String(weightStr).toLowerCase();
  if (str.includes('kg')) {
    return parseFloat(str.replace(/[^\d.]/g, '')) * 1000;
  } else if (str.includes('g')) {
    return parseFloat(str.replace(/[^\d.]/g, ''));
  } else if (str.includes('ml') || str.includes('l')) {
    if (str.includes('ml')) {
      return parseFloat(str.replace(/[^\d.]/g, ''));
    } else {
      return parseFloat(str.replace(/[^\d.]/g, '')) * 1000;
    }
  } else if (str.includes('egg')) {
    return parseFloat(str.replace(/[^\d.]/g, '')) * 50;
  } else {
    const num = parseFloat(str.replace(/[^\d.]/g, ''));
    return isNaN(num) ? 0 : num;
  }
};

// Helper function to calculate and update Product_Weight
const updateProductWeight = async (cart) => {
  const totalWeight = cart.reduce((total, item) => {
    const itemWeight = parseWeight(item.weight);
    return total + (itemWeight * item.quantity);
  }, 0);
  
  await set(ref(database, 'Shopping_Basket/Product_Weight'), totalWeight.toFixed(2));
  return totalWeight;
};

// Mode 1: Add item to cart
const handleAddToCart = async (productName, cart, setCart, user) => {
  if (!productName) {
    console.warn('No product name provided');
    return;
  }

  try {
    // Find product by title
    const productsRef = ref(database, 'Shopping_Basket/products');
    const snapshot = await get(productsRef);
    const products = snapshot.val();

    let targetProduct = null;
    let productId = null;

    for (const [id, product] of Object.entries(products || {})) {
      if (product.title?.toLowerCase() === productName.toLowerCase()) {
        targetProduct = { ...product, id };
        productId = id;
        break;
      }
    }

    if (!targetProduct) {
      console.warn('Product not found:', productName);
      return;
    }

    // Update cart
    const updatedCart = [...cart];
    const existingItem = updatedCart.find(item => item.id === productId);

    if (existingItem) {
      existingItem.quantity += 1;
      console.log(`➕ Increased ${productName} quantity to ${existingItem.quantity}`);
    } else {
      updatedCart.push({ ...targetProduct, quantity: 1 });
      console.log(`➕ Added ${productName} to cart`);
    }

    setCart(updatedCart);

    // Save to Firebase
    if (user && !user.isAdmin) {
      await set(ref(database, `Shopping_Basket/carts/${user.uid}`), {
        items: updatedCart,
        updatedAt: new Date().toISOString()
      });
    }

    // Update Product_Weight
    await updateProductWeight(updatedCart);

    // Update Direction to 'S' (Success)
    await set(ref(database, 'Shopping_Basket/Direction'), 'S');
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    await set(ref(database, 'Shopping_Basket/Direction'), 'E'); // Error
  }
};

// Mode 2: Remove item from cart
const handleRemoveFromCart = async (productName, cart, setCart, user) => {
  if (!productName) {
    console.warn('No product name provided');
    return;
  }

  try {
    const updatedCart = [...cart];
    const itemIndex = updatedCart.findIndex(
      item => item.title?.toLowerCase() === productName.toLowerCase()
    );

    if (itemIndex === -1) {
      console.warn('Item not in cart:', productName);
      await set(ref(database, 'Shopping_Basket/Direction'), 'E');
      return;
    }

    const item = updatedCart[itemIndex];
    
    if (item.quantity > 1) {
      item.quantity -= 1;
      console.log(`➖ Decreased ${productName} quantity to ${item.quantity}`);
    } else {
      updatedCart.splice(itemIndex, 1);
      console.log(`🗑️ Removed ${productName} from cart`);
    }

    setCart(updatedCart);

    // Save to Firebase
    if (user && !user.isAdmin) {
      await set(ref(database, `Shopping_Basket/carts/${user.uid}`), {
        items: updatedCart,
        updatedAt: new Date().toISOString()
      });
    }

    // Update Product_Weight
    await updateProductWeight(updatedCart);

    await set(ref(database, 'Shopping_Basket/Direction'), 'S');
    
  } catch (error) {
    console.error('Error removing from cart:', error);
    await set(ref(database, 'Shopping_Basket/Direction'), 'E');
  }
};

// Mode 3: Reset/Clear cart
const handleResetCart = async (setCart, user) => {
  try {
    console.log('🔄 Resetting cart...');
    setCart([]);

    // Clear cart in Firebase
    if (user && !user.isAdmin) {
      await set(ref(database, `Shopping_Basket/carts/${user.uid}`), {
        items: [],
        updatedAt: new Date().toISOString()
      });
    }

    // Clear Product_Name and Product_Weight
    await set(ref(database, 'Shopping_Basket/Product_Name'), '');
    await set(ref(database, 'Shopping_Basket/Product_Weight'), '0');
    await set(ref(database, 'Shopping_Basket/Direction'), 'S');
    
    console.log('✅ Cart reset complete');
  } catch (error) {
    console.error('Error resetting cart:', error);
    await set(ref(database, 'Shopping_Basket/Direction'), 'E');
  }
};

// Mode 4: Generate bill and create order
const handleGenerateBill = async (cart, user) => {
  if (!cart || cart.length === 0) {
    console.warn('Cart is empty, cannot generate bill');
    await set(ref(database, 'Shopping_Basket/Direction'), 'E');
    return;
  }

  try {
    console.log('💰 Triggering payment modal...');

    // Trigger payment modal event
    const event = new CustomEvent('openPaymentModal', { detail: { cart, user } });
    window.dispatchEvent(event);

    await set(ref(database, 'Shopping_Basket/Direction'), 'S');

  } catch (error) {
    console.error('Error generating bill:', error);
    await set(ref(database, 'Shopping_Basket/Direction'), 'E');
  }
};
