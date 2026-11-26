"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import "./overview.css";

export default function OverviewPage() {
  return (
    <div className="overview-page">
      <div className="overview-header">
        <h1>Welcome back, Dudu! 👋</h1>
        <p>Here's what's happening with your orders today.</p>
      </div>

      <div className="overview-cta">
        <button className="btn btn-primary">+ New Order</button>
      </div>

      <section className="refer-earn-section">
        <div className="refer-earn-content">
          <h2>🎁 Refer & Earn ₦1,000.00</h2>
          <p>
            Invite friends to SpaciMore. When someone you refer completes their first order, you earn ₦1,000.00 — credited to your wallet.
          </p>
          <div className="refer-actions">
            <span className="refer-code">1266FA30</span>
            <button className="btn btn-secondary">📋 Copy link</button>
            <button className="btn btn-secondary">🔗 Share</button>
          </div>
          <div className="refer-stats">
            <div className="stat">
              <div className="stat-label">Pending</div>
              <div className="stat-value">0</div>
            </div>
            <div className="stat">
              <div className="stat-label">Earned</div>
              <div className="stat-value">₦0.00</div>
            </div>
            <div className="stat">
              <div className="stat-label">Paid out</div>
              <div className="stat-value">₦0.00</div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">0</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">0</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-label">Completed</div>
            <div className="stat-value">0</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <div className="stat-label">Wallet Balance</div>
            <div className="stat-value">₦0.00</div>
          </div>
        </div>
      </section>

      <section className="recent-orders-section">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <Link href="/dashboard/orders" className="view-all">
            View all <ChevronRight size={16} />
          </Link>
        </div>

        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>No orders yet</p>
          <button className="btn btn-primary">Create your first order</button>
        </div>
      </section>
    </div>
  );
}
