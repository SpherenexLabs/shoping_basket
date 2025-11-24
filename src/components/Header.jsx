import React from 'react';
import './Header.css';

const Header = ({ cartCount, onAdminClick, user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1 className="store-title">🛍️ Shopping Store</h1>
        </div>
        
        <div className="header-center">
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search products..." 
              className="search-input"
            />
            <button className="search-button">🔍</button>
          </div>
        </div>
        
        <div className="header-right">
          {user?.isAdmin && (
            <button className="admin-btn" onClick={onAdminClick}>
              Admin Dashboard
            </button>
          )}
          
          <div className="cart-icon">
            <span className="cart-badge">{cartCount}</span>
            🛒
          </div>
          
          <div className="user-profile-section">
            <div className="user-profile">
              <svg className="profile-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <button className="logout-btn" onClick={onLogout} title="Logout">
              🚪
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
