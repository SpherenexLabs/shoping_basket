import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import './Login.css';

const Login = ({ onSwitchToRegister, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Admin login check
    if (isAdmin) {
      if (email === 'admin@gmail.com' && password === 'admin123') {
        onLoginSuccess({ email, role: 'admin', isAdmin: true });
        setLoading(false);
        return;
      } else {
        setError('Invalid admin credentials');
        setLoading(false);
        return;
      }
    }

    // Customer login with Firebase
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess({ 
        email: userCredential.user.email, 
        uid: userCredential.user.uid,
        role: 'customer',
        isAdmin: false
      });
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/invalid-credential':
          setError('Invalid email or password');
          break;
        default:
          setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>🛍️ Shopping Store</h2>
          <p>{isAdmin ? 'Admin Login' : 'Customer Login'}</p>
        </div>

        <div className="login-toggle">
          <button 
            className={!isAdmin ? 'active' : ''} 
            onClick={() => setIsAdmin(false)}
          >
            Customer
          </button>
          <button 
            className={isAdmin ? 'active' : ''} 
            onClick={() => setIsAdmin(true)}
          >
            Admin
          </button>
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
              placeholder={isAdmin ? 'admin@gmail.com' : 'Enter your email'}
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
              placeholder={isAdmin ? 'admin123' : 'Enter your password'}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {!isAdmin && (
          <div className="register-link">
            <p>Don't have an account? 
              <button onClick={onSwitchToRegister}>Register here</button>
            </p>
          </div>
        )}

        {isAdmin && (
          <div className="admin-hint">
            <p className="hint-text">
              Admin Credentials:<br />
              Email: admin@gmail.com<br />
              Password: admin123
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
