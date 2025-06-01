// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

// Define API_BASE_URL consistently
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // To check auth status on initial load

  // Function to check auth status on initial load (or when app is reloaded)
  useEffect(() => {
    const checkLoggedInStatus = async () => {
      setIsLoading(true);
      try {
        // We need to ensure axios sends cookies for this request
        const response = await axios.get(`${API_BASE_URL}/auth/status`, {
          withCredentials: true, // IMPORTANT for sending session cookies
        });
        if (response.data && response.data.logged_in) {
          setCurrentUser(response.data.user);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setCurrentUser(null); // Assume not logged in if status check fails
      } finally {
        setIsLoading(false);
      }
    };
    checkLoggedInStatus();
  }, []);

  const login = async (identifier, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, 
        { identifier, password },
        { withCredentials: true } // IMPORTANT
      );
      if (response.data && response.data.user) {
        setCurrentUser(response.data.user);
        setIsLoading(false);
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Login error:", error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || "Login failed." };
    }
    setIsLoading(false); // Should be caught by try/catch but good practice
    return { success: false, message: "An unexpected error occurred during login." };
  };

  const register = async (username, email, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, 
        { username, email, password },
        { withCredentials: true } // IMPORTANT
      );
      if (response.data && response.data.user) {
        setCurrentUser(response.data.user); // Log in user immediately after registration
        setIsLoading(false);
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Registration error:", error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || "Registration failed." };
    }
    setIsLoading(false);
    return { success: false, message: "An unexpected error occurred during registration." };
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
        withCredentials: true, // IMPORTANT
      });
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Still log out on frontend even if backend call fails for some reason
      setCurrentUser(null); 
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentUser,
    isLoggedIn: !!currentUser, // True if currentUser is not null
    isLoadingAuth: isLoading, // Renamed to avoid conflict with other loading states
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children} {/* Don't render children until initial auth check is done */}
    </AuthContext.Provider>
  );
};