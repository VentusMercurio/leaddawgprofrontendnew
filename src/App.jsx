// src/App.jsx
import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './context/AuthContext';
// In your src/App.jsx or src/main.jsx or src/index.css
import 'leaflet/dist/leaflet.css';
import './App.css'; 

function App() {
  const { isLoggedIn, currentUser, logout, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/'); 
  };

  // Show a global loading indicator while checking auth status
  if (isLoadingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color, #121212)', color: 'var(--text-color)', fontSize: '1.5rem' }}>
        Initializing LeadDawg Pro...
      </div>
    );
  }

  return (
    <>
      <nav className="app-navbar">
        <NavLink to="/" className="navbar-brand">LeadDawg Pro</NavLink>
        <div className="navbar-links">
          {isLoggedIn ? (
            <>
              <NavLink to="/dashboard" className="nav-link" activeClassName="active">My Leads</NavLink>
              {/* <NavLink to="/profile" className="nav-link" activeClassName="active">Profile</NavLink> */}
              <button onClick={handleLogout} className="nav-link-button">
                Logout ({currentUser?.username || 'User'})
              </button>
            </>
          ) : (
            <>
              <NavLink to="/pricing" className="nav-link" activeClassName="active">Pricing</NavLink>
              <NavLink to="/login" className="nav-link" activeClassName="active">Login</NavLink>
              <NavLink to="/register" className="nav-link" activeClassName="active">Sign Up</NavLink>
            </>
          )}
        </div>
      </nav>

      <div className="main-app-content"> 
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-canceled" element={<PaymentCancelPage />} />
          
          {/* Example of a protected route for Dashboard */}
          <Route 
            path="/dashboard" 
            element={isLoggedIn ? <DashboardPage /> : <LoginPage />} 
            // Replace with a proper <ProtectedRoute> component later for cleaner logic
          />
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;