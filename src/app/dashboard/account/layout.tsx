"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { signOutAction } from "@/app/actions";
import { BrandLink } from "@/components/brand-link";
import "./account-layout.css";

interface AccountLayoutProps {
  children: ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/dashboard/account/overview", label: "Overview", icon: "grid" },
    { href: "/dashboard/account/orders", label: "Orders", icon: "shopping" },
    { href: "/dashboard/account/messages", label: "Messages", icon: "message" },
    { href: "/dashboard/account/wallet", label: "Wallet", icon: "wallet" },
    { href: "/dashboard/account/addresses", label: "Addresses", icon: "map" },
    { href: "/dashboard/account/settings", label: "Settings", icon: "settings" },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="account-layout">
      <aside className={`account-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="sidebar-header">
          <BrandLink className="sidebar-brand" />
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Account navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? "is-active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className={`nav-icon nav-icon-${item.icon}`} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link href="/dashboard" className="nav-item nav-item-back">
            <ChevronLeft size={18} />
            Back to Browse
          </Link>
          <form action={signOutAction}>
            <button className="nav-item nav-item-logout" type="submit">
              <LogOut size={18} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="account-wrapper">
        <header className="account-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          <div className="header-spacer" />
          <div className="header-actions">
            <div className="user-profile-icon">JD</div>
          </div>
        </header>

        <main className="account-main">{children}</main>
      </div>
    </div>
  );
}
