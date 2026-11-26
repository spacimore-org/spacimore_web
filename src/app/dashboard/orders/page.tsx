"use client";

import { Search, Filter, ChevronDown } from "lucide-react";
import "./orders.css";

export default function OrdersPage() {
  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>My Orders</h1>
        <p>View and manage all your shopping orders</p>
      </div>

      <div className="orders-controls">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search by location..."
            aria-label="Search orders"
          />
        </div>

        <div className="filter-dropdown">
          <Filter size={18} />
          <select aria-label="Filter orders by status">
            <option>All Statuses</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
        </div>

        <button className="btn btn-primary">+ New Order</button>
      </div>

      <div className="orders-container">
        <div className="orders-count">
          <h2>0 Orders</h2>
        </div>

        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>No orders yet</p>
          <p className="empty-description">Create an order to start shopping with our marketplace</p>
          <button className="btn btn-primary">Create your first order</button>
        </div>
      </div>
    </div>
  );
}
