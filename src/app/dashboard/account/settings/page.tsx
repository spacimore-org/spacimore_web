"use client";

import "./settings.css";

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences</p>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <h2>Account Information</h2>
          <div className="setting-item">
            <label>Email</label>
            <div className="setting-value">user@example.com</div>
          </div>
          <div className="setting-item">
            <label>Phone</label>
            <div className="setting-value">Not added</div>
            <button className="btn btn-secondary">Update</button>
          </div>
        </section>

        <section className="settings-section">
          <h2>Security</h2>
          <div className="setting-item">
            <label>Password</label>
            <div className="setting-value">••••••••</div>
            <button className="btn btn-secondary">Change Password</button>
          </div>
        </section>

        <section className="settings-section danger-zone">
          <h2>Danger Zone</h2>
          <div className="setting-item">
            <label>Delete Account</label>
            <p className="setting-description">Permanently delete your account and all associated data</p>
            <button className="btn btn-danger">Delete Account</button>
          </div>
        </section>
      </div>
    </div>
  );
}
