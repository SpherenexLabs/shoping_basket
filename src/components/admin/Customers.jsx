import React, { useState, useEffect } from 'react';
import { ref, onValue, get, set } from 'firebase/database';
import { database } from '../../firebase/firebase';
import './Customers.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const usersRef = ref(database, 'Shopping_Basket/users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const customersArray = Object.entries(data).map(([id, customer]) => ({
          id,
          ...customer
        }));
        setCustomers(customersArray);
      }
    });
  }, []);

  const updateCustomerIds = async () => {
    if (!window.confirm('This will assign customer IDs to all customers without one. Continue?')) {
      return;
    }

    setUpdating(true);
    try {
      // Get current counter value
      const counterRef = ref(database, 'Shopping_Basket/customerIdCounter');
      const counterSnapshot = await get(counterRef);
      let currentCounter = counterSnapshot.val() || 0;

      // Update customers without customerIds
      const updatePromises = customers.map(async (customer) => {
        if (!customer.customerId) {
          currentCounter++;
          const customerId = `CUST${String(currentCounter).padStart(4, '0')}`;
          
          await set(ref(database, `Shopping_Basket/users/${customer.id}/customerId`), customerId);
          return customerId;
        }
        return null;
      });

      await Promise.all(updatePromises);
      
      // Update counter
      await set(counterRef, currentCounter);
      
      alert('Customer IDs updated successfully!');
    } catch (error) {
      console.error('Error updating customer IDs:', error);
      alert('Failed to update customer IDs: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-customers"
          />
        </div>
        <div className="customer-stats-mini">
          <span className="stat-mini">
            Total: <strong>{customers.length}</strong>
          </span>
          <button 
            className="update-ids-btn" 
            onClick={updateCustomerIds}
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Assign Customer IDs'}
          </button>
        </div>
      </div>

      <div className="customers-grid">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="customer-card">
              <div className="customer-avatar">
                <div className="avatar-circle">
                  {customer.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              
              <div className="customer-info">
                <h3>{customer.fullName || 'Unknown User'}</h3>
                <div className="customer-details">
                  {customer.customerId && (
                    <div className="detail-row">
                      <span className="detail-icon">🆔</span>
                      <span className="detail-text"><strong>{customer.customerId}</strong></span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-icon">📧</span>
                    <span className="detail-text">{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="detail-row">
                      <span className="detail-icon">📱</span>
                      <span className="detail-text">{customer.phone}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">Joined: {formatDate(customer.createdAt)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">👤</span>
                    <span className="detail-text">Role: {customer.role || 'customer'}</span>
                  </div>
                </div>
              </div>

              <div className="customer-actions">
                <button className="btn-view-customer" title="View Details">
                  👁️ View
                </button>
                <button className="btn-message-customer" title="Send Message">
                  💬 Message
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-customers">
            <span className="empty-icon">👥</span>
            <p>No customers found</p>
            <small>Start by registering new customers</small>
          </div>
        )}
      </div>

      {/* Alternative Table View */}
      <div className="customers-table-container">
        <table className="customers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Joined Date</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td>
                    <div className="table-customer-name">
                      <div className="table-avatar">
                        {customer.fullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <strong>{customer.fullName || 'Unknown'}</strong>
                    </div>
                  </td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || 'N/A'}</td>
                  <td>{formatDate(customer.createdAt)}</td>
                  <td>
                    <span className="role-badge">
                      {customer.role || 'customer'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="table-btn-view" title="View">👁️</button>
                      <button className="table-btn-edit" title="Edit">✏️</button>
                      <button className="table-btn-delete" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="table-no-data">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
