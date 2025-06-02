// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
// No direct axios import needed here if AuthContext handles the API call
// import axios from 'axios'; 
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

// API_BASE_URL is now primarily used within AuthContext
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

// Remove the temporary Axios interceptor if it was specific to debugging direct calls from this page
// const loginApi = axios.create(); 
// loginApi.interceptors.request.use(...)

function LoginPage() {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // This will be for the page's own loading state
  
  const navigate = useNavigate();
  const location = useLocation(); 
  // Get the login function and relevant states from AuthContext
  const { login: contextLogin, isLoggedIn, currentUser, isLoadingAuth, isActionLoading } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard'; 

  useEffect(() => {
    if (!isLoadingAuth) { // Only act once initial auth check is complete
      if (isLoggedIn && currentUser) {
        console.log("LoginPage useEffect: User already logged in, redirecting.");
        navigate(from, { replace: true });
      } else {
        console.log("LoginPage useEffect: User not logged in, ensuring form is clear.");
        setEmailInput('');
        setPasswordInput('');
        setError(''); 
      }
    }
  }, [isLoggedIn, currentUser, isLoadingAuth, navigate, from]);


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true); // Indicate page is attempting login

    const emailToSubmit = emailInput;
    const passwordToSubmit = passwordInput;

    if (!emailToSubmit || !passwordToSubmit) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }
    
    console.log("DEBUG [LoginPage]: ---- NEW LOGIN ATTEMPT ----");
    console.log("DEBUG [LoginPage]: Email for context login:", emailToSubmit);
    console.log("DEBUG [LoginPage]: Password for context login (length):", passwordToSubmit.length);

    try {
      // Call the login function from AuthContext
      const result = await contextLogin(emailToSubmit, passwordToSubmit); 

      console.log("Login attempt result from AuthContext in LoginPage:", result);

      if (result.success && result.user) {
        // AuthContext's login function already called setCurrentUser.
        // The context is now updated.
        console.log("LoginPage: Login via context successful, navigating...");
        navigate(from, { replace: true });
      } else {
        // Error message comes from the result object returned by contextLogin
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) { 
      // This catch block is for unexpected errors if contextLogin itself throws 
      // something not caught internally and returned as { success: false, ... }
      console.error("Unexpected error during LoginPage handleSubmit calling contextLogin:", err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false); // Login attempt finished
    }
  };

  // If initial auth is still loading, you might want to show a page-level loader
  // or disable the form, but App.jsx's AppContent already shows a global loader.
  // So, we primarily use `isLoading` for the submit button.

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authFormCard}>
        <h2 className={styles.authTitle}>Login to LeadDawg Pro</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>Email (or Username)</label>
            <input
              type="email" 
              id="email"
              className={styles.formInput}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading || isActionLoading} // Disable if page is loading OR auth action is loading
              autoComplete="username"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>Password</label>
            <input
              type="password"
              id="password"
              className={styles.formInput}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading || isActionLoading} // Disable if page is loading OR auth action is loading
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className={styles.authButton} disabled={isLoading || isActionLoading}>
            {isLoading || isActionLoading ? 'Logging In...' : 'Login'} {/* Show loading based on either */}
          </button>
        </form>
        <p className={styles.authRedirectLink}>
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;