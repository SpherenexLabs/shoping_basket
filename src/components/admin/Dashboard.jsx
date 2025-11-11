import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
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

    // Fetch orders and calculate revenue
    const ordersRef = ref(database, 'Shopping_Basket/orders');
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orders = Object.values(data);
        const revenue = orders.reduce((sum, order) => {
          return sum + (order.totalAmount || order.total || 0);
        }, 0);
        
        setStats(prev => ({ 
          ...prev, 
          totalOrders: orders.length,
          totalRevenue: revenue
        }));

        // Build recent activity from orders
        const activities = orders
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map((order, index) => ({
            id: index,
            action: `Order ${order.orderNumber} - ₹${order.totalAmount?.toFixed(2)} (${order.paymentMethod})`,
            time: formatTimeAgo(order.createdAt),
            type: 'order',
            customer: order.customerName
          }));
        
        setRecentActivity(activities);
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
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: '👥',
      color: '#F59E0B',
      bgColor: '#FEF3C7'
    },
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
