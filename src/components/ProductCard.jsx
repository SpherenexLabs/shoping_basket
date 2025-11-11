import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './ProductCard.css';

const ProductCard = ({ product, onAddToCart, productIndex }) => {
  const discountPercentage = product.discount 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  // Create QR code data with product information - simplified for easier scanning
  const qrData = `${productIndex + 1}|${product.title}|${product.weight}|${product.discount ? product.discountPrice : product.price}`;

  return (
    <div className="product-card">
      {product.discount && (
        <div className="discount-badge">-{discountPercentage}%</div>
      )}
      
      <div className="product-image">
        <img src={product.image} alt={product.title} />
      </div>
      
      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        <p className="product-category">{product.category}</p>
        
        {product.weight && (
          <div className="product-weight">
            <span>⚖️ {product.weight}</span>
          </div>
        )}
        
        <div className="product-pricing">
          {product.discount ? (
            <>
              <span className="original-price">₹{product.price.toFixed(2)}</span>
              <span className="discount-price">₹{product.discountPrice.toFixed(2)}</span>
            </>
          ) : (
            <span className="regular-price">₹{product.price.toFixed(2)}</span>
          )}
        </div>
        
        <div className="product-rating">
          {'⭐'.repeat(Math.floor(product.rating))}
          <span className="rating-number">({product.rating})</span>
        </div>
        
        <div className="qr-code-container">
          <QRCodeSVG 
            value={qrData}
            size={120}
            level="L"
            includeMargin={true}
          />
          <p className="qr-label">Product ID: {productIndex + 1}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
