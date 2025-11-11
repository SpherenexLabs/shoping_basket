import React, { useState } from 'react';
import { ref, set } from 'firebase/database';
import { database } from '../firebase/firebase';

// Products data from your old Firebase
const productsData = {
  "1": {
    "category": "Nuts & Seeds",
    "discount": true,
    "discountPrice": 19.99,
    "id": "1",
    "image": "https://images.unsplash.com/photo-1508747703725-719777637510?w=400&h=300&fit=crop",
    "price": 24.99,
    "rating": 4.8,
    "title": "Premium Organic Almonds",
    "weight": "500g"
  },
  "-OdlR9wRxyHhdGrG9BP6": {
    "category": "Fruits",
    "discount": true,
    "discountPrice": 6.49,
    "id": "2",
    "image": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop",
    "price": 8.99,
    "rating": 4.5,
    "title": "Fresh Strawberries Pack",
    "weight": "1kg"
  },
  "-OdlR9wSUh0nFf5qgwJB": {
    "category": "Bakery",
    "discount": false,
    "id": "3",
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
    "price": 4.99,
    "rating": 4.3,
    "title": "Whole Grain Bread",
    "weight": "750g"
  },
  "-OdlR9wUSaLznOvv5sZm": {
    "category": "Dairy & Eggs",
    "discount": true,
    "discountPrice": 5.49,
    "id": "4",
    "image": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop",
    "price": 6.99,
    "rating": 4.9,
    "title": "Organic Free Range Eggs",
    "weight": "12 eggs"
  },
  "-OdlR9wWu5YZ2YzRRmK5": {
    "category": "Dairy & Eggs",
    "discount": false,
    "id": "5",
    "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
    "price": 5.99,
    "rating": 4.6,
    "title": "Greek Yogurt Natural",
    "weight": "500g"
  },
  "-OdlR9wYNS4OWP1T2_Qq": {
    "category": "Beverages",
    "discount": true,
    "discountPrice": 14.99,
    "id": "6",
    "image": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop",
    "price": 18.99,
    "rating": 4.7,
    "title": "Premium Coffee Beans",
    "weight": "1kg"
  },
  "-OdlR9wZPvWgker3gSSZ": {
    "category": "Pantry",
    "discount": true,
    "discountPrice": 9.99,
    "image": "https://foodcare.in/cdn/shop/files/71gyVTaNOYL.jpg?v=1738908479",
    "price": 12.99,
    "rating": 4.8,
    "title": "Organic Honey Raw",
    "weight": "500g"
  },
  "-OdlR9wbAgwoSKKvXsOQ": {
    "category": "Seafood",
    "discount": false,
    "id": "8",
    "image": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop",
    "price": 22.99,
    "rating": 4.9,
    "title": "Fresh Salmon Fillet",
    "weight": "400g"
  },
  "-OdlR9wdXqVgJjAN0PCK": {
    "category": "Grains",
    "discount": true,
    "discountPrice": 7.99,
    "id": "9",
    "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
    "price": 9.99,
    "rating": 4.4,
    "title": "Quinoa Organic",
    "weight": "1kg"
  },
  "-OdlR9weRSH7HurgU2OG": {
    "category": "Oils & Vinegars",
    "discount": false,
    "id": "10",
    "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop",
    "price": 16.99,
    "rating": 4.7,
    "title": "Extra Virgin Olive Oil",
    "weight": "750ml"
  },
  "-OdlR9whG2iYCc03GoeB": {
    "category": "Snacks",
    "discount": true,
    "discountPrice": 5.99,
    "id": "11",
    "image": "https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=400&h=300&fit=crop",
    "price": 7.99,
    "rating": 4.6,
    "title": "Dark Chocolate Premium",
    "weight": "200g"
  },
  "-OdlR9wkPbJF8zXhHZTz": {
    "category": "Beverages",
    "discount": true,
    "discountPrice": 8.99,
    "image": "https://www.bigvalueshop.com/wp-content/uploads/2021/07/Organic-India-Tulsi-Green-Tea-Classic_cover3.jpg",
    "price": 11.99,
    "rating": 4.5,
    "title": "Green Tea Organic",
    "weight": "100g (50 bags)"
  },
  "-OdlR9wkPbJF8zXhHZU-": {
    "category": "Pasta & Noodles",
    "discount": false,
    "image": "https://m.media-amazon.com/images/I/51fmOyyARxL.jpg",
    "price": 3.99,
    "rating": 4.3,
    "title": "Pasta Whole Wheat",
    "weight": "500g"
  },
  "-OdlR9wlDDStPB6Bb45u": {
    "category": "Dairy & Eggs",
    "discount": true,
    "discountPrice": 10.99,
    "id": "14",
    "image": "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=300&fit=crop",
    "price": 13.99,
    "rating": 4.8,
    "title": "Cheddar Cheese Aged",
    "weight": "400g"
  },
  "-OdlR9wqjBq_G0DOt0kA": {
    "category": "Nuts & Seeds",
    "discount": true,
    "discountPrice": 12.99,
    "id": "15",
    "image": "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop",
    "price": 15.99,
    "rating": 4.7,
    "title": "Mixed Nuts Premium",
    "weight": "600g"
  },
  "-OdlU2hK7JLxe8YIZsnv": {
    "category": "Beverages",
    "discount": true,
    "discountPrice": 25,
    "id": "-OdlU2hK7JLxe8YIZsnv",
    "image": "https://5.imimg.com/data5/SELLER/Default/2022/2/AL/QD/HP/3067591/coffee-powder-500x500.jpg",
    "price": 30,
    "rating": 4.5,
    "title": "Coffee Powder",
    "weight": "20g"
  }
};

const ImportProducts = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleImport = async () => {
    setError('');
    setStatus('Starting import...');
    setLoading(true);

    try {
      // Log current database info
      console.log('Database URL:', database.app.options.databaseURL);
      console.log('Database instance:', database);
      
      const productsRef = ref(database, 'Shopping_Basket/products');
      console.log('Products reference path:', productsRef.toString());
      
      setStatus('Importing 16 products to new Firebase...');
      console.log('Writing products data:', productsData);
      
      await set(productsRef, productsData);
      
      console.log('✅ Products written successfully!');
      setStatus('✅ Successfully imported all 16 products!');
      
      setTimeout(() => {
        alert('Products imported successfully! The page will reload now.');
        window.location.reload();
      }, 1000);
      
    } catch (err) {
      console.error('Import error:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      setError(`Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2>📦 Import Products</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.content}>
          <div style={styles.info}>
            <h3>Ready to Import:</h3>
            <ul style={styles.productList}>
              <li>✓ Premium Organic Almonds</li>
              <li>✓ Fresh Strawberries Pack</li>
              <li>✓ Whole Grain Bread</li>
              <li>✓ Organic Free Range Eggs</li>
              <li>✓ Greek Yogurt Natural</li>
              <li>✓ Premium Coffee Beans</li>
              <li>✓ Organic Honey Raw</li>
              <li>✓ Fresh Salmon Fillet</li>
              <li>✓ Quinoa Organic</li>
              <li>✓ Extra Virgin Olive Oil</li>
              <li>✓ Dark Chocolate Premium</li>
              <li>✓ Green Tea Organic</li>
              <li>✓ Pasta Whole Wheat</li>
              <li>✓ Cheddar Cheese Aged</li>
              <li>✓ Mixed Nuts Premium</li>
              <li>✓ Coffee Powder</li>
            </ul>
            <p style={styles.count}>Total: <strong>16 products</strong></p>
          </div>

          {status && (
            <div style={styles.status}>{status}</div>
          )}

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <div style={styles.actions}>
            <button 
              onClick={handleImport} 
              disabled={loading}
              style={{
                ...styles.importBtn,
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? '⏳ Importing...' : '📥 Import All Products'}
            </button>
          </div>

          <div style={styles.note}>
            This will import all products to: Shopping_Basket/products
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  container: {
    background: 'white',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '2px solid #e5e7eb',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '12px 12px 0 0'
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    fontSize: '1.5rem',
    cursor: 'pointer'
  },
  content: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1
  },
  info: {
    background: '#f0f9ff',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #0ea5e9'
  },
  productList: {
    maxHeight: '200px',
    overflowY: 'auto',
    marginBottom: '12px',
    paddingLeft: '20px'
  },
  count: {
    textAlign: 'center',
    fontSize: '1.1rem',
    marginTop: '12px'
  },
  status: {
    padding: '12px',
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    marginBottom: '16px',
    fontWeight: '500'
  },
  error: {
    padding: '12px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginBottom: '16px',
    fontWeight: '500'
  },
  actions: {
    marginBottom: '16px'
  },
  importBtn: {
    width: '100%',
    padding: '14px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  note: {
    padding: '12px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: '8px',
    fontSize: '0.875rem',
    textAlign: 'center'
  }
};

export default ImportProducts;
