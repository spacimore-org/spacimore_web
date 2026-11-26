"use client";

import "./wallet.css";

export default function WalletPage() {
  return (
    <div className="wallet-page">
      <div className="page-header">
        <h1>Wallet</h1>
        <p>View your balance and transaction history</p>
      </div>

      <div className="wallet-balance-card">
        <h2>Wallet Balance</h2>
        <div className="balance-amount">₦0.00</div>
        <div className="wallet-actions">
          <button className="btn btn-secondary">Withdraw</button>
          <button className="btn btn-secondary">Add Funds</button>
        </div>
      </div>

      <div className="transaction-section">
        <h2>Transaction History</h2>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>No transactions yet</p>
          <p className="empty-description">Your wallet transactions will appear here</p>
        </div>
      </div>
    </div>
  );
}
