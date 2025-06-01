// src/pages/PaymentSuccessPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function PaymentSuccessPage() {
  return (
    <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-color)' }}>
      <h2 style={{color: 'var(--success-color)'}}>✓ Payment Successful!</h2>
      <p>Your subscription is active.</p>
      <Link to="/dashboard" style={{fontSize: '1.2em', marginTop: '20px', display: 'inline-block'}}>Go to Dashboard</Link>
    </div>
  );
}
export default PaymentSuccessPage;