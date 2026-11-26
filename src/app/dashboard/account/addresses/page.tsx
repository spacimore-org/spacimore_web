"use client";

import "./addresses.css";

export default function AddressesPage() {
  return (
    <div className="addresses-page">
      <div className="page-header">
        <h1>Addresses</h1>
        <p>Manage your delivery addresses</p>
      </div>

      <div className="addresses-actions">
        <button className="btn btn-primary">+ Add New Address</button>
      </div>

      <div className="addresses-container">
        <div className="empty-state">
          <div className="empty-icon">📍</div>
          <p>No addresses yet</p>
          <p className="empty-description">Add delivery addresses to make ordering faster</p>
          <button className="btn btn-primary">Add your first address</button>
        </div>
      </div>
    </div>
  );
}
