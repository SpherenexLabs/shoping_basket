import React, { useState } from 'react';
import './AdminPanel.css';
import Dashboard from './admin/Dashboard';
import Orders from './admin/Orders';
import Inventory from './admin/Inventory';
import Customers from './admin/Customers';
import MigrateData from '../utils/MigrateData';
import ImportProducts from '../utils/ImportProducts';

const AdminPanel = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMigration, setShowMigration] = useState(false);
  const [showImportProducts, setShowImportProducts] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'inventory', label: 'Inventory', icon: '📋' },
    { id: 'customers', label: 'Customers', icon: '👥' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <Orders />;
      case 'inventory':
        return <Inventory />;
      case 'customers':
        return <Customers />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>🛍️ Admin Panel</h2>
          <p className="admin-email">{user?.email}</p>
        </div>

        <nav className="admin-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button 
            className="admin-import-btn" 
            onClick={() => setShowImportProducts(true)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '8px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>📦</span>
            <span>Import Products</span>
          </button>
          <button 
            className="admin-migrate-btn" 
            onClick={() => setShowMigration(true)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '8px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>🔄</span>
            <span>Migrate Data</span>
          </button>
          <button className="admin-logout-btn" onClick={onLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <div className="admin-content-header">
          <h1>{menuItems.find(item => item.id === activeTab)?.label}</h1>
          <div className="admin-user-info">
            <span className="admin-badge">Admin</span>
          </div>
        </div>
        
        <div className="admin-content-body">
          {renderContent()}
        </div>
      </main>

      {showImportProducts && (
        <ImportProducts onClose={() => setShowImportProducts(false)} />
      )}

      {showMigration && (
        <MigrateData onClose={() => setShowMigration(false)} />
      )}
    </div>
  );
};

export default AdminPanel;
