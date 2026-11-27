"use client";

import { Check, ChevronLeft } from "lucide-react";
import Image from "next/image";

interface VendorWelcomeProps {
  onContinue: () => void;
  onCancel: () => void;
}

export function VendorWelcome({ onContinue, onCancel }: VendorWelcomeProps) {
  return (
    <div className="vendor-welcome-container">
      <button
        className="vendor-welcome-back"
        onClick={onCancel}
        aria-label="Go back"
        type="button"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="vendor-welcome-header">
        <div className="vendor-welcome-logo">
          <Image
            src="/business vendor.png"
            alt="MarketPlace Logo"
            width={300}
            height={300}
            priority
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
      </div>

      <div className="vendor-welcome-content">
        <h1 className="vendor-welcome-title">
          Welcome <span className="vendor-welcome-highlight">Vendor!</span>
        </h1>

        <p className="vendor-welcome-subtitle">
          Join MarketPlace and grow your business with thousands of customers.
        </p>

        <div className="vendor-welcome-benefits">
          <div className="benefit-card">
            <div className="benefit-icon">📈</div>
            <div className="benefit-title">Grow Your Business</div>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">👥</div>
            <div className="benefit-title">Reach More Customers</div>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">👜</div>
            <div className="benefit-title">Manage Your Store Easily</div>
          </div>
        </div>

        <div className="vendor-welcome-requirements">
          <h2>What You'll Need</h2>
          <ul className="requirements-list">
            <li>
              <Check size={20} />
              <span>Business Information</span>
            </li>
            <li>
              <Check size={20} />
              <span>Valid ID (BVN or NIN)</span>
            </li>
            <li>
              <Check size={20} />
              <span>Business Address</span>
            </li>
            <li>
              <Check size={20} />
              <span>Bank Account Details</span>
            </li>
          </ul>
        </div>

        <button
          className="vendor-welcome-continue-btn"
          onClick={onContinue}
          type="button"
        >
          Continue
        </button>

        <button
          className="vendor-welcome-cancel-btn"
          onClick={onCancel}
          type="button"
        >
          Cancel Registration
        </button>
      </div>
    </div>
  );
}
