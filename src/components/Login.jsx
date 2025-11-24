import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Login attempt:', { email, password });

    // Admin login check
    if (email === 'admin@gmail.com' && password === 'admin123') {
      console.log('Admin credentials matched, calling onLoginSuccess');
      const userData = { email, role: 'admin', isAdmin: true };
      console.log('User data:', userData);
      onLoginSuccess(userData);
      setLoading(false);
      return;
    } else {
      console.log('Invalid credentials');
      setError('Invalid admin credentials');
      setLoading(false);
      return;
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>🛍️ Shopping Store</h2>
          <p>Admin Login</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="admin-hint">
          <p className="hint-text">
            Admin Credentials:<br />
            Email: admin@gmail.com<br />
            Password: admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
