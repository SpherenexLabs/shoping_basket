import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../firebase/firebase';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [currentWeight, setCurrentWeight] = useState('0.00');
  const [newWeight, setNewWeight] = useState('');
  const [updatingWeight, setUpdatingWeight] = useState(false);

  useEffect(() => {
    // Fetch products count
    const productsRef = ref(database, 'Shopping_Basket/products');
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      const count = data ? Object.keys(data).length : 0;
      setStats(prev => ({ ...prev, totalProducts: count }));
    });

    // Fetch customers count
    const usersRef = ref(database, 'Shopping_Basket/users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const count = data ? Object.keys(data).length : 0;
      setStats(prev => ({ ...prev, totalCustomers: count }));
    });

    // Fetch orders from orders collection and calculate revenue
    const ordersRef = ref(database, 'Shopping_Basket/orders');
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orders = Object.entries(data).map(([id, order]) => ({
          id,
          ...order
        }));
        
        // Calculate total revenue from orders
        const revenue = orders.reduce((sum, order) => {
          return sum + (parseFloat(order.total_amount) || 0);
        }, 0);
        
        // Count total orders
        const orderCount = orders.length;
        
        setStats(prev => ({ 
          ...prev, 
          totalOrders: orderCount,
          totalRevenue: revenue
        }));

        // Build recent activity from orders
        const activities = orders
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5)
          .map((order) => ({
            id: order.id,
            action: `Order ${order.order_id || 'N/A'} - ₹${parseFloat(order.total_amount || 0).toFixed(2)} (Online)`,
            time: formatTimeAgo(order.timestamp),
            type: 'order',
            customer: `Customer ${order.customer_id || 'Unknown'}`
          }));
        
        setRecentActivity(activities);
      } else {
        setStats(prev => ({ 
          ...prev, 
          totalOrders: 0,
          totalRevenue: 0
        }));
        setRecentActivity([]);
      }
    });

    // Fetch current Weight value from Firebase
    const weightRef = ref(database, 'Shopping_Basket/Weight');
    onValue(weightRef, (snapshot) => {
      const weight = snapshot.val();
      console.log('Weight from Firebase:', weight);
      if (weight !== null && weight !== undefined) {
        setCurrentWeight(parseFloat(weight).toFixed(2));
      } else {
        setCurrentWeight('0');
      }
    });
  }, []);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const handleSetWeight = async () => {
    if (!newWeight || newWeight.trim() === '') {
      alert('Please enter a weight value');
      return;
    }

    const weightValue = parseFloat(newWeight);
    if (isNaN(weightValue)) {
      alert('Please enter a valid number');
      return;
    }

    setUpdatingWeight(true);
    try {
      const weightRef = ref(database, 'Shopping_Basket/Weight');
      await set(weightRef, weightValue);
      alert(`Weight updated successfully to ${weightValue}`);
      setNewWeight('');
    } catch (error) {
      console.error('Error updating weight:', error);
      alert('Failed to update weight: ' + error.message);
    } finally {
      setUpdatingWeight(false);
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: '📦',
      color: '#4F46E5',
      bgColor: '#EEF2FF'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      icon: '💰',
      color: '#10B981',
      bgColor: '#D1FAE5'
    },
    // {
    //   title: 'Total Customers',
    //   value: stats.totalCustomers,
    //   icon: '👥',
    //   color: '#F59E0B',
    //   bgColor: '#FEF3C7'
    // },
    {
      title: 'Products',
      value: stats.totalProducts,
      icon: '📋',
      color: '#EF4444',
      bgColor: '#FEE2E2'
    }
  ];

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
            <div className="stat-icon" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Weight Control</h3>
          <div className="weight-control-section">
            <div className="current-weight">
              <label>Current Weight:</label>
              <span className="weight-value">{currentWeight} g</span>
            </div>
            <div className="weight-input-group">
              <input
                type="number"
                step="0.01"
                placeholder="Enter new weight (grams)"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="weight-input"
                disabled={updatingWeight}
              />
              <button 
                onClick={handleSetWeight}
                className="set-weight-btn"
                disabled={updatingWeight}
              >
                {updatingWeight ? 'Updating...' : '⚖️ Set Weight'}
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'user' && '👤'}
                    {activity.type === 'order' && '📦'}
                    {activity.type === 'inventory' && '📋'}
                    {activity.type === 'delivery' && '✅'}
                  </div>
                  <div className="activity-content">
                    <p className="activity-action">{activity.action}</p>
                    {activity.customer && (
                      <span className="activity-customer">Customer: {activity.customer}</span>
                    )}
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activity">
                <p>No recent orders yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
