// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  // Renaming for clarity: isLoadingAuth refers to the initial status check
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 
  // You might want a separate isLoading for specific actions like login/register
  const [isActionLoading, setIsActionLoading] = useState(false);


  // Check auth status on initial load and when certain critical states might change
  // Using useCallback for checkLoggedInStatus to stabilize its reference if used in other useEffects
  const checkLoggedInStatus = useCallback(async () => {
    console.log("AuthContext: Checking auth status...");
    setIsLoadingAuth(true); // Indicate initial auth check is happening
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/status`, {
        withCredentials: true, 
      });
      // Assuming backend /auth/status returns something like:
      // { "isLoggedIn": true, "user": { "id": 1, "username": "test", "email": "...", "tier": "free" } }
      // OR { "isLoggedIn": false }
      if (response.data && response.data.isLoggedIn && response.data.user) {
        setCurrentUser(response.data.user);
        console.log("AuthContext: User is logged in.", response.data.user);
      } else {
        setCurrentUser(null);
        console.log("AuthContext: User is not logged in (status check).");
      }
    } catch (error) {
      // A 401 here is normal if not logged in and endpoint is @login_required
      if (error.response && error.response.status === 401) {
        console.log("AuthContext: User is not logged in (401 from status check).");
      } else {
        console.error("AuthContext: Error checking auth status:", error.response?.data?.message || error.message);
      }
      setCurrentUser(null);
    } finally {
      setIsLoadingAuth(false); // Initial auth check complete
    }
  }, []); // No dependencies, runs once on mount

  useEffect(() => {
    checkLoggedInStatus();
  }, [checkLoggedInStatus]);


  const login = async (emailOrUsername, password) => { // Changed 'identifier' to be more specific
    setIsActionLoading(true);
    try {
      // CORRECTED URL: remove /api
      const response = await axios.post(`${API_BASE_URL}/auth/login`, 
        { email: emailOrUsername, password }, // Assuming backend expects 'email' for login ID
        // If backend can take 'username' or 'email', you might need to send both or adjust backend.
        // Or, if your input field is 'identifier', then { identifier: emailOrUsername, password }
        { withCredentials: true }
      );
      if (response.data && response.data.user) {
        setCurrentUser(response.data.user);
        console.log("AuthContext: Login successful.", response.data.user);
        setIsActionLoading(false);
        return { success: true, user: response.data.user };
      } else {
        // This case should ideally not be hit if backend returns user on success
        // or a proper error structure.
        setIsActionLoading(false);
        return { success: false, message: response.data.message || "Login returned unexpected data." };
      }
    } catch (error) {
      setIsActionLoading(false);
      console.error("AuthContext: Login error:", error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || "Login failed." };
    }
  };

  const register = async (username, email, password) => {
    setIsActionLoading(true);
    try {
      // CORRECTED URL: remove /api
      const response = await axios.post(`${API_BASE_URL}/auth/register`, 
        { username, email, password },
        { withCredentials: true }
      );
      if (response.data && response.data.user) {
        setCurrentUser(response.data.user); // Log in user immediately after registration
        console.log("AuthContext: Registration successful, user logged in.", response.data.user);
        setIsActionLoading(false);
        return { success: true, user: response.data.user };
      } else {
        setIsActionLoading(false);
        return { success: false, message: response.data.message || "Registration returned unexpected data." };
      }
    } catch (error) {
      setIsActionLoading(false);
      console.error("AuthContext: Registration error:", error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || "Registration failed." };
    }
  };

  const logout = async () => {
    // setIsActionLoading(true); // Optional: show loading state during logout
    try {
      // CORRECTED URL: remove /api
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        withCredentials: true,
      });
      console.log("AuthContext: Logout successful on backend.");
    } catch (error) {
      console.error("AuthContext: Logout API call error:", error.response?.data?.message || error.message);
      // Even if backend call fails, proceed to clear frontend state
    } finally {
      setCurrentUser(null);
      // setIsActionLoading(false);
      console.log("AuthContext: User state cleared on frontend after logout attempt.");
      // Navigation is typically handled by the component calling logout
    }
  };

  const value = {
    currentUser,
    isLoggedIn: !!currentUser,
    isLoadingAuth, // For initial app load
    isActionLoading, // For login/register/logout buttons
    login,
    register,
    logout,
    checkLoggedInStatus, // Expose if needed for manual refresh of status
  };

  return (
    <AuthContext.Provider value={value}>
      {children} 
      {/* Removed !isLoadingAuth && children. 
          isLoadingAuth is handled by AppContent now.
          The provider should always render its children. 
          Components consuming the context can decide what to render based on isLoadingAuth.
      */}
    </AuthContext.Provider>
  );
};