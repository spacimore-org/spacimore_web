"use client";

import "./messages.css";

export default function MessagesPage() {
  return (
    <div className="messages-page">
      <div className="page-header">
        <h1>Messages</h1>
        <p>Chat with your shopping agents</p>
      </div>

      <div className="messages-container">
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p>No messages yet</p>
          <p className="empty-description">Create an order to start chatting with an agent</p>
          <a href="/dashboard/overview" className="btn btn-primary">Create your first order →</a>
        </div>
      </div>
    </div>
  );
}
