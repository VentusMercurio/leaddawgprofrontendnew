// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Your AuthContext
import styles from './AuthPage.module.css'; // Assuming a shared CSS module for auth pages

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

function LoginPage() {
  const [email, setEmail] = useState(''); // Or username, depending on your backend
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation(); // To get 'from' state for redirect after login
  const { login: contextLogin, setIsLoadingAuth } = useAuth(); // Get login function from context

  const from = location.state?.from?.pathname || '/dashboard'; // Redirect to dashboard or previous page

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`, 
        { email, password }, // Or { username: email, password } if backend uses username
        { withCredentials: true } // ESSENTIAL for session cookies
      );

      console.log("Login response:", response.data);

      if (response.data && response.data.user) {
        // Call the login function from AuthContext to update global auth state
        // The contextLogin function should ideally set the user and isLoggedIn state
        // and potentially fetch full user details again if needed (or trust response.data.user)
        contextLogin(response.data.user); 

        // Navigate to the intended page after successful login
        // If login was successful, the backend set a cookie. 
        // Subsequent calls (like to /auth/status by AuthContext) should now work.
        // Consider briefly setting isLoadingAuth true if contextLogin refetches status
        // if (setIsLoadingAuth) setIsLoadingAuth(true); 
        navigate(from, { replace: true });
      } else {
        // Should not happen if backend sends user on success
        setError(response.data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error("Login API error:", err.response || err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.message === "Network Error") {
        setError('Network error. Please check your connection or try again later.');
      } 
      else {
        setError('Login failed. Please check your credentials or try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authFormCard}>
        <h2 className={styles.authTitle}>Login to LeadDawg Pro</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>Email (or Username)</label>
            <input
              type="email" // Change to "text" if using username primarily
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
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" className={styles.authButton} disabled={isLoading}>
            {isLoading ? 'Logging In...' : 'Login'}
          </button>
        </form>
        <p className={styles.authRedirectLink}>
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
        {/* Optional: Add "Forgot Password?" link here later */}
      </div>
    </div>
  );
}

export default LoginPage;