import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove, push } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { products as initialProducts } from '../../data/products';
import './Inventory.css';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Firebase with initial products on first load
  useEffect(() => {
    const productsRef = ref(database, 'Shopping_Basket/products');
    
    // Check if products exist in Firebase
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Products exist, load them - use Firebase key as the ID
        const productsArray = Object.entries(data).map(([firebaseKey, product]) => ({
          ...product,
          id: firebaseKey, // Use Firebase key as the ID
          firebaseKey: firebaseKey // Store Firebase key
        }));
        setProducts(productsArray);
      } else {
        // No products, initialize with initial data
        initialProducts.forEach(product => {
          const productRef = push(ref(database, 'Shopping_Basket/products'));
          set(productRef, {
            title: product.title,
            category: product.category,
            price: product.price,
            discountPrice: product.discountPrice,
            discount: product.discount,
            weight: product.weight,
            rating: product.rating,
            image: product.image
          });
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.title}"?`)) {
      try {
        // Use the product's id which is the Firebase key
        const productRef = ref(database, `Shopping_Basket/products/${product.id}`);
        await remove(productRef);
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product: ' + error.message);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowAddModal(true);
  };

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-inv"
          />
        </div>
        <button className="add-product-btn" onClick={handleAddProduct}>
          ➕ Add Product
        </button>
      </div>

      <div className="inventory-stats">
        <div className="inv-stat-card">
          <span className="inv-stat-label">Total Products</span>
          <span className="inv-stat-value">{products.length}</span>
        </div>
        <div className="inv-stat-card">
          <span className="inv-stat-label">Categories</span>
          <span className="inv-stat-value">{new Set(products.map(p => p.category)).size}</span>
        </div>
        <div className="inv-stat-card">
          <span className="inv-stat-label">In Stock</span>
          <span className="inv-stat-value">{products.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading products...</p>
        </div>
      ) : (
        <>
          <div className="products-grid-inventory">
            {filteredProducts.map(product => (
              <div key={product.id} className="inventory-card">
                <div className="inv-card-image">
                  <img src={product.image} alt={product.title} />
                  {product.discount && (
                    <span className="inv-discount-badge">-{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%</span>
                  )}
                </div>
                
                <div className="inv-card-content">
                  <h3>{product.title}</h3>
                  <p className="inv-category">{product.category}</p>
                  
                  <div className="inv-details">
                    <div className="inv-price">
                      {product.discount ? (
                        <>
                          <span className="inv-original">₹{product.price.toFixed(2)}</span>
                          <span className="inv-discounted">₹{product.discountPrice.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="inv-regular">₹{product.price.toFixed(2)}</span>
                      )}
                    </div>
                    
                    {product.weight && (
                      <span className="inv-weight">⚖️ {product.weight}</span>
                    )}
                  </div>

                  <div className="inv-rating">
                    {'⭐'.repeat(Math.floor(product.rating))} ({product.rating})
                  </div>

                  <div className="inv-actions">
                    <button className="inv-btn-edit" onClick={() => handleEdit(product)}>
                      ✏️ Edit
                    </button>
                    <button className="inv-btn-delete" onClick={() => handleDelete(product)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="no-products">
              <span className="empty-icon">📦</span>
              <p>No products found</p>
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};

// Product Modal Component
const ProductModal = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    category: product?.category || '',
    price: product?.price || '',
    discountPrice: product?.discountPrice || '',
    discount: product?.discount || false,
    weight: product?.weight || '',
    rating: product?.rating || 4.5,
    image: product?.image || ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const productData = {
        title: formData.title,
        category: formData.category,
        price: parseFloat(formData.price),
        discountPrice: formData.discount ? parseFloat(formData.discountPrice) : null,
        discount: formData.discount,
        weight: formData.weight,
        rating: parseFloat(formData.rating),
        image: formData.image
      };

      if (product) {
        // Update existing product - use Firebase key as ID
        await set(ref(database, `Shopping_Basket/products/${product.id}`), productData);
        alert('Product updated successfully!');
      } else {
        // Add new product - Firebase will auto-generate key
        const newProductRef = push(ref(database, 'Shopping_Basket/products'));
        await set(newProductRef, productData);
        alert('Product added successfully!');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <div className="form-group-modal">
              <label htmlFor="title">Product Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter product title"
              />
            </div>

            <div className="form-group-modal">
              <label htmlFor="category">Category *</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                placeholder="e.g., Fruits, Dairy & Eggs"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group-modal">
              <label htmlFor="price">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>

            <div className="form-group-modal">
              <label htmlFor="weight">Weight</label>
              <input
                type="text"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="e.g., 500g, 1kg"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group-modal checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="discount"
                  checked={formData.discount}
                  onChange={handleChange}
                />
                <span>This product has a discount</span>
              </label>
            </div>

            {formData.discount && (
              <div className="form-group-modal">
                <label htmlFor="discountPrice">Discount Price (₹) *</label>
                <input
                  type="number"
                  id="discountPrice"
                  name="discountPrice"
                  value={formData.discountPrice}
                  onChange={handleChange}
                  required={formData.discount}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          <div className="form-group-modal">
            <label htmlFor="rating">Rating (1-5)</label>
            <input
              type="number"
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              step="0.1"
              min="1"
              max="5"
            />
          </div>

          <div className="form-group-modal">
            <label htmlFor="image">Image URL *</label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              required
              placeholder="https://example.com/image.jpg"
            />
            {formData.image && (
              <div className="image-preview">
                <img src={formData.image} alt="Preview" />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Inventory;
