// src/App.jsx
import React from 'react';
// BrowserRouter is typically imported as Router at the top level of your app setup
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage'; // <-- IMPORT THE NEW PAGE
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import AuthProvider here

// Leaflet CSS (good place for it)
import 'leaflet/dist/leaflet.css';
import './App.css'; // Your global app styles

// Navbar component to be used within AuthProvider and Router
function NavbarComponent() {
  const { isLoggedIn, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout(); // Assuming logout is an async function that handles API call
      navigate('/'); 
    } catch (error) {
      console.error("Logout failed:", error);
      // Handle logout error display if necessary
    }
  };

  return (
    <nav className="app-navbar">
      <NavLink to="/" className="navbar-brand">LeadDawg Pro</NavLink>
      <div className="navbar-links">
        {isLoggedIn && currentUser ? ( // Check for currentUser as well for robustness
          <>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>My Leads</NavLink>
            {/* Pro tier users might see more links here */}
            {currentUser.tier === 'pro' && (
                <span className="nav-link pro-badge">PRO</span>
            )}
            <button onClick={handleLogout} className="nav-link-button">
              Logout ({currentUser.username})
            </button>
          </>
        ) : (
          <>
            <NavLink to="/pricing" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Pricing</NavLink>
            <NavLink to="/login" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Login</NavLink>
            <NavLink to="/register" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Sign Up</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

// Main App structure
function AppContent() {
  const { isLoadingAuth } = useAuth(); // isLoadingAuth from context

  if (isLoadingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color, #121212)', color: 'var(--text-color)', fontSize: '1.5rem' }}>
        Initializing LeadDawg Pro...
      </div>
    );
  }

  return (
    <>
      <NavbarComponent /> {/* Render Navbar here */}
      <div className="main-app-content"> 
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search-results" element={<ResultsPage />} /> {/* <-- ADDED ROUTE FOR RESULTS */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-canceled" element={<PaymentCancelPage />} />
          
          {/* 
            Protected Route for Dashboard:
            For a cleaner approach, you'd typically create a <ProtectedRoute> component
            that handles the redirect logic if not logged in.
          */}
          <Route 
            path="/dashboard" 
            element={<DashboardPage />} // Render DashboardPage, protection handled inside or by a wrapper
            // To actually protect it, DashboardPage itself should check isLoggedIn
            // or you wrap it: element={isLoggedIn ? <DashboardPage /> : <Navigate to="/login" replace />}
            // (using Navigate from react-router-dom for redirection)
          />
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </>
  );
}

// Top-level App component that wraps everything with Providers
function App() {
  return (
      <AuthProvider>
        <AppContent />
      </AuthProvider>
  );
}

export default App;