// src/pages/PaymentCancelPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function PaymentCancelPage() {
  return (
    <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-color)' }}>
      <h2 style={{color: 'var(--danger-color)'}}>Payment Canceled</h2>
      <p>Your payment process was not completed.</p>
      <Link to="/pricing" style={{fontSize: '1.2em', marginTop: '20px', display: 'inline-block'}}>View Pricing</Link>
    </div>
  );
}
export default PaymentCancelPage;