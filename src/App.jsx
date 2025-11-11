import { useState, useEffect, useRef } from 'react'
import { ref, set, onValue, get } from 'firebase/database'
import { database } from './firebase/firebase'
import './App.css'
import Header from './components/Header'
import ProductCard from './components/ProductCard'
import Login from './components/Login'
import Register from './components/Register'
import AdminPanel from './components/AdminPanel'
import QRScanner from './components/QRScanner'
import PaymentModal from './components/PaymentModal'
import Toast from './components/Toast'
import { useModeController } from './hooks/useModeController'

function App() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastScanId, setLastScanId] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Enable Mode-based cart controller for customers
  useModeController(user, cart, setCart);

  // Show toast notification (debounced)
  const showToast = (message, type = 'success') => {
    // Clear existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    setToast({ message, type, id: Date.now() });
    
    // Auto-hide after 2 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2000);
  };

  // Listen for payment modal trigger from mode controller
  useEffect(() => {
    const handleOpenPayment = () => {
      setShowPaymentModal(true);
    };

    window.addEventListener('openPaymentModal', handleOpenPayment);
    return () => window.removeEventListener('openPaymentModal', handleOpenPayment);
  }, []);

  // Verify Firebase connection on mount
  useEffect(() => {
    const verifyConnection = async () => {
      try {
        const testRef = ref(database, '.info/connected');
        const snapshot = await get(testRef);
        console.log('✅ Firebase connected:', database.app.options.databaseURL);
      } catch (err) {
        console.error('❌ Firebase connection error:', err);
      }
    };
    verifyConnection();
  }, []);

  // Check if user is logged in (from localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('shopping_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch products from Firebase in real-time
  useEffect(() => {
    const productsRef = ref(database, 'Shopping_Basket/products');
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsArray = Object.entries(data).map(([id, product]) => ({
          id,
          ...product
        }));
        setProducts(productsArray);
      }
      setLoading(false);
    });
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('shopping_user', JSON.stringify(userData));
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('shopping_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    localStorage.removeItem('shopping_user');
  };

  const handleAddToCart = async (product) => {
    const updatedCart = [...cart];
    const existingItem = updatedCart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      updatedCart.push({ ...product, quantity: 1 });
    }
    
    setCart(updatedCart);

    // Calculate total weight for Product_Weight field
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

    const totalWeight = updatedCart.reduce((total, item) => {
      const itemWeight = parseWeight(item.weight);
      return total + (itemWeight * item.quantity);
    }, 0);

    // Save cart to Firebase if user is logged in
    if (user && !user.isAdmin) {
      try {
        await set(ref(database, `Shopping_Basket/carts/${user.uid}`), {
          items: updatedCart,
          updatedAt: new Date().toISOString()
        });
        
        // Update Product_Name and Product_Weight in Firebase for hardware display
        await set(ref(database, 'Shopping_Basket/Product_Name'), product.title);
        await set(ref(database, 'Shopping_Basket/Product_Weight'), totalWeight.toFixed(2));
        
        // Show toast notification instead of alert
        showToast(`${product.title} added to cart!`);
        
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    }
  };

  const handleAdminClick = () => {
    alert('Admin Dashboard - Coming Soon!');
  };

  // Handle QR scan payloads of the form: id|title|weight|price
  const handleScan = async (decodedText) => {
    try {
      const parts = String(decodedText).split('|');
      const scannedId = parts[0]?.trim();
      if (!scannedId) return;

      // Skip if identical scan just processed (within 2 seconds)
      const scanKey = `${scannedId}_${Date.now()}`;
      if (scannedId === lastScanId) {
        console.log('Skipping duplicate scan:', scannedId);
        return;
      }
      setLastScanId(scannedId);

      // Reset after 2 seconds to allow rescanning same product
      setTimeout(() => {
        if (lastScanId === scannedId) setLastScanId('');
      }, 2000);

      let product = products.find(p => String(p.id) === scannedId);
      if (!product && parts.length >= 4) {
        // Fallback: try reconstructing minimal product from QR if not found in list
        const [id, title, weight, price] = parts;
        product = { id, title, weight, price: Number(price) || 0 };
      }
      if (!product) return;

      // Add to cart without showing alert (toast shown in handleAddToCart)
      await handleAddToCart(product);
      
    } catch (e) {
      console.error('Error handling scanned data:', e);
    }
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Show login/register screens if not logged in
  if (!user) {
    if (showRegister) {
      return (
        <Register 
          onSwitchToLogin={() => setShowRegister(false)}
          onRegisterSuccess={handleRegisterSuccess}
        />
      );
    }
    return (
      <Login 
        onSwitchToRegister={() => setShowRegister(true)}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Show Admin Panel if admin is logged in
  if (user.isAdmin) {
    return <AdminPanel user={user} onLogout={handleLogout} />;
  }

  // Show customer dashboard if logged in
  return (
    <div className="app">
      <Header 
        cartCount={cartCount} 
        onAdminClick={handleAdminClick}
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="main-content">
        <div className="container">
          {user && (
            <p className="welcome-message">
              Welcome, {user.isAdmin ? 'Admin' : user.fullName || user.email}! 👋
            </p>
          )}
          
          {/* QR Scanner - Always visible and live streaming */}
          <QRScanner 
            user={user}
            onScan={handleScan}
          />

          <div className="products-header">
            <h2>Featured Products</h2>
            <p>Discover our selection of premium quality products</p>
          </div>
          
          {loading ? (
            <div className="loading-products">
              <p>Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="products-grid">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  productIndex={index}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="no-products-store">
              <p>No products available at the moment</p>
            </div>
          )}
        </div>
      </main>

      {showPaymentModal && cart.length > 0 && (
        <PaymentModal
          cart={cart}
          user={user}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(orderData) => {
            setCart([]);
            setShowPaymentModal(false);
          }}
        />
      )}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App
