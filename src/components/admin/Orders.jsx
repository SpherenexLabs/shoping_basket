import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/firebase';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const ordersRef = ref(database, 'Shopping_Basket/orders');
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ordersArray = Object.entries(data).map(([id, order]) => ({
          id,
          ...order
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first
        setOrders(ordersArray);
      } else {
        setOrders([]);
      }
    });
  }, []);

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status?.toLowerCase() === filterStatus);

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    switch (statusLower) {
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div className="filter-buttons">
          <button 
            className={filterStatus === 'all' ? 'active' : ''}
            onClick={() => setFilterStatus('all')}
          >
            All Orders ({orders.length})
          </button>
          <button 
            className={filterStatus === 'pending' ? 'active' : ''}
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </button>
          <button 
            className={filterStatus === 'processing' ? 'active' : ''}
            onClick={() => setFilterStatus('processing')}
          >
            Processing
          </button>
          <button 
            className={filterStatus === 'delivered' ? 'active' : ''}
            onClick={() => setFilterStatus('delivered')}
          >
            Delivered
          </button>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td className="order-id">#{order.orderNumber || order.id}</td>
                  <td>
                    <div className="customer-info">
                      <strong>{order.customerName}</strong>
                      <span>{order.customerEmail}</span>
                      {order.customerId && <span className="customer-id">ID: {order.customerId}</span>}
                    </div>
                  </td>
                  <td>{Array.isArray(order.items) ? order.items.length : order.items}</td>
                  <td className="order-total">₹{(order.totalAmount || order.total || 0).toFixed(2)}</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td>{formatDate(order.createdAt || order.date)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-view" title="View Details">👁️</button>
                      <button className="btn-edit" title="Edit">✏️</button>
                      <button className="btn-delete" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-orders">
                  <div className="empty-state">
                    <span className="empty-icon">📦</span>
                    <p>No orders found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
