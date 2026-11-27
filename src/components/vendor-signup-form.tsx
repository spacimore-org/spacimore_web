"use client";

import { Check } from "lucide-react";
import Image from "next/image";

interface VendorSignupFormProps {
  isPending: boolean;
  error?: string;
}

export function VendorSignupForm({
  isPending,
  error,
}: VendorSignupFormProps) {
  return (
    <div className="vendor-signup-wrapper">
      <div className="vendor-signup-header">
        <div className="vendor-signup-logo">
          <Image
            src="/header.png"
            alt="MarketPlace: Shop, Sell, Grow"
            width={344}
            height={110}
            priority
            style={{ width: "auto", height: "auto", maxWidth: "280px" }}
          />
        </div>
      </div>

      <div className="vendor-signup-illustration">
        <Image
          src="/bvsh.png"
          alt="Storefront Illustration"
          width={370}
          height={202}
          priority
          style={{ width: "auto", height: "auto", maxWidth: "280px" }}
        />
      </div>

      <div className="vendor-signup-form">
        <h1 className="vendor-signup-title">
          <span className="vendor-signup-highlight">Business</span> Vendor
        </h1>

        <p className="vendor-signup-subtitle">
          Join MarketPlace and grow your business with thousands of customers.
        </p>

        <div className="vendor-signup-benefits">
          <div className="benefit-item">
            <div className="benefit-icon">📈</div>
            <div className="benefit-label">Grow Your Business</div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">👥</div>
            <div className="benefit-label">Reach More Customers</div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">👜</div>
            <div className="benefit-label">Manage Your Store Easily</div>
          </div>
        </div>

        <div className="vendor-signup-requirements">
          <h2>What You'll Need</h2>
          <ul>
            <li>
              <Check size={18} />
              <span>Business Information</span>
            </li>
            <li>
              <Check size={18} />
              <span>Valid ID (BVN or NIN)</span>
            </li>
            <li>
              <Check size={18} />
              <span>Business Address</span>
            </li>
            <li>
              <Check size={18} />
              <span>Bank Account Details</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
