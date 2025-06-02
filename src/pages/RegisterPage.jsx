// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Your AuthContext
import styles from './AuthPage.module.css'; // Assuming a shared CSS module for auth pages

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login: contextLogin, setIsLoadingAuth } = useAuth(); // Get login function from context to log user in after register

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/register`, 
        { username, email, password },
        { withCredentials: true } // IMPORTANT for session cookies
      );

      console.log("Registration response:", response.data);

      if (response.data && response.data.user && response.status === 201) {
        setSuccessMessage('Registration successful! You are now logged in.');
        // Call the login function from AuthContext to update global auth state
        contextLogin(response.data.user);
        
        // Redirect after a short delay to let user see success message
        setTimeout(() => {
          // if (setIsLoadingAuth) setIsLoadingAuth(true); // If contextLogin triggers a status re-fetch
          navigate('/dashboard'); // Or wherever you want to redirect after registration
        }, 1500); 
      } else {
        // This case might be hit if backend returns 200 OK but not the expected user data
        setError(response.data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error("Registration API error:", err.response || err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message); // Display backend error (e.g., "Username already exists")
      } else if (err.message === "Network Error") {
        setError('Network error. Please check your connection or try again later.');
      }
      else {
        setError('Registration failed. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authFormCard}>
        <h2 className={styles.authTitle}>Create Your LeadDawg Pro Account</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        {successMessage && <p className={styles.successMessage}>{successMessage}</p>} {/* Style this class */}
        
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.formLabel}>Username</label>
            <input
              type="text"
              id="username"
              className={styles.formInput}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              disabled={isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>Email</label>
            <input
              type="email"
              id="email"
              className={styles.formInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>Password</label>
            <input
              type="password"
              id="password"
              className={styles.formInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              disabled={isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.formLabel}>Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              className={styles.formInput}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" className={styles.authButton} disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Create Account'}
          </button>
        </form>
        <p className={styles.authRedirectLink}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;