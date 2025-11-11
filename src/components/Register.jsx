import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get, runTransaction } from 'firebase/database';
import { auth, database } from '../firebase/firebase';
import './Register.css';

const Register = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      const user = userCredential.user;

      // Generate unique customer ID
      const customerIdRef = ref(database, 'Shopping_Basket/customerIdCounter');
      let customerId = '';

      await runTransaction(customerIdRef, (currentCounter) => {
        // If counter doesn't exist, start from 1
        const nextCounter = (currentCounter || 0) + 1;
        return nextCounter;
      }).then((result) => {
        const counterValue = result.snapshot.val();
        // Format as CUST0001, CUST0002, etc.
        customerId = `CUST${String(counterValue).padStart(4, '0')}`;
      });

      // Store user data in Realtime Database under Shopping_Basket/users
      await set(ref(database, `Shopping_Basket/users/${user.uid}`), {
        customerId: customerId,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        createdAt: new Date().toISOString(),
        role: 'customer'
      });

      onRegisterSuccess({ 
        email: user.email, 
        uid: user.uid,
        customerId: customerId,
        fullName: formData.fullName,
        role: 'customer',
        isAdmin: false
      });

    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        default:
          setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="register-header">
          <h2>🛍️ Shopping Store</h2>
          <p>Create Your Account</p>
        </div>

        <form onSubmit={handleRegister} className="register-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min 6 characters)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
            />
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="login-link">
          <p>Already have an account? 
            <button onClick={onSwitchToLogin}>Login here</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
