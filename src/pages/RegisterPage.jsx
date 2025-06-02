// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // Keep for direct API call
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

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
  // Get the 'register' function from AuthContext. 
  // It will make the API call AND update the context state (currentUser).
  const { register: contextRegister } = useAuth(); 

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
      // Call the register function from AuthContext
      // This function will make the API call and update currentUser in context
      const result = await contextRegister(username, email, password);

      console.log("Registration attempt result from context:", result);

      if (result.success && result.user) {
        setSuccessMessage('Registration successful! You are now logged in.');
        // AuthContext's register function already called setCurrentUser.
        // No need to call contextLogin here.
        
        setTimeout(() => {
          navigate('/dashboard'); 
        }, 1500); 
      } else {
        // Error message should come from result.message
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) { 
      // This catch block might be less likely to be hit if contextRegister handles its own errors well,
      // but keep for safety for unexpected issues.
      console.error("Unexpected error during registration process:", err);
      setError('An unexpected error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ... Your JSX for the registration form (this part was fine) ...
    <div className={styles.authPageContainer}>
      <div className={styles.authFormCard}>
        <h2 className={styles.authTitle}>Create Your LeadDawg Pro Account</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
        
        <form onSubmit={handleSubmit} className={styles.authForm}>
          {/* Username Input */}
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.formLabel}>Username</label>
            <input
              type="text" id="username" className={styles.formInput}
              value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username" required disabled={isLoading}
            />
          </div>
          {/* Email Input */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>Email</label>
            <input
              type="email" id="email" className={styles.formInput}
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required disabled={isLoading}
            />
          </div>
          {/* Password Input */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>Password</label>
            <input
              type="password" id="password" className={styles.formInput}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters" required disabled={isLoading}
            />
          </div>
          {/* Confirm Password Input */}
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.formLabel}>Confirm Password</label>
            <input
              type="password" id="confirmPassword" className={styles.formInput}
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password" required disabled={isLoading}
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