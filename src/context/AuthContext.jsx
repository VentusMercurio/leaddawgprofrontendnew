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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 
  const [isActionLoading, setIsActionLoading] = useState(false);

  const checkLoggedInStatus = useCallback(async () => {
    console.log("AuthContext: Checking auth status...");
    setIsLoadingAuth(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/status`, {
        withCredentials: true, 
      });
      if (response.data && response.data.isLoggedIn && response.data.user) {
        setCurrentUser(response.data.user);
        console.log("AuthContext: User is logged in.", response.data.user);
      } else {
        setCurrentUser(null);
        console.log("AuthContext: User is not logged in (status check).");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("AuthContext: User is not logged in (401 from status check).");
      } else {
        console.error("AuthContext: Error checking auth status:", error.response?.data?.message || error.message);
      }
      setCurrentUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []); 

  useEffect(() => {
    checkLoggedInStatus();
  }, [checkLoggedInStatus]);

  const login = async (emailOrUsername, password) => {
    setIsActionLoading(true);
    try {
      const payload = { email: emailOrUsername, password }; // Prepare payload
      console.log("AuthContext: Attempting login with payload:", payload);

      const response = await axios.post(
        `${API_BASE_URL}/auth/login`, 
        payload, // Send the defined payload
        { 
          withCredentials: true,
          headers: { // --- EXPLICITLY SET CONTENT-TYPE ---
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data && response.data.user) {
        setCurrentUser(response.data.user);
        console.log("AuthContext: Login successful.", response.data.user);
        return { success: true, user: response.data.user }; // Return success and user
      } else {
        return { success: false, message: response.data.message || "Login returned unexpected data." };
      }
    } catch (error) {
      console.error("AuthContext: Login error:", error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || "Login failed." };
    } finally {
      setIsActionLoading(false); // Ensure this is always called
    }
  };

  const register = async (username, email, password) => {
    setIsActionLoading(true);
    try {
      const payload = { username, email, password }; // Prepare payload
      console.log("AuthContext: Attempting registration with payload:", payload);

      const response = await axios.post(
        `${API_BASE_URL}/auth/register`, 
        payload, // Send the defined payload
        { 
          withCredentials: true,
          headers: { // --- EXPLICITLY SET CONTENT-TYPE ---
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data && response.data.user) {
        setCurrentUser(response.data.user); 
        console.log("AuthContext: Registration successful, user logged in.", response.data.user);
        return { success: true, user: response.data.user };
      } else {
        return { success: false, message: response.data.message || "Registration returned unexpected data." };
      }
    } catch (error) {
      console.error("AuthContext: Registration error:", error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || "Registration failed." };
    } finally {
      setIsActionLoading(false); // Ensure this is always called
    }
  };

  const logout = async () => {
    // setIsActionLoading(true); // Usually not needed for logout button as UI change is immediate
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, 
        {}, // Empty body for logout
        { // Config object
          withCredentials: true,
          // No explicit Content-Type needed for empty body, but doesn't hurt
          // headers: { 'Content-Type': 'application/json' } 
        }
      );
      console.log("AuthContext: Logout successful on backend.");
    } catch (error) {
      console.error("AuthContext: Logout API call error:", error.response?.data?.message || error.message);
    } finally {
      setCurrentUser(null);
      console.log("AuthContext: User state cleared on frontend after logout attempt.");
      // setIsActionLoading(false);
    }
  };

  const value = {
    currentUser,
    isLoggedIn: !!currentUser,
    isLoadingAuth,
    isActionLoading,
    login,
    register,
    logout,
    checkLoggedInStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children} 
    </AuthContext.Provider>
  );
};