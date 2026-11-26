"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { signOutAction } from "@/app/actions";
import { BrandLink } from "@/components/brand-link";
import "./dashboard.css";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/dashboard/overview", label: "Overview", icon: "grid" },
    { href: "/dashboard/orders", label: "Orders", icon: "shopping" },
    { href: "/dashboard/messages", label: "Messages", icon: "message" },
    { href: "/dashboard/wallet", label: "Wallet", icon: "wallet" },
    { href: "/dashboard/addresses", label: "Addresses", icon: "map" },
    { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="dashboard-layout">
      <aside className={`dashboard-sidebar ${sidebarOpen ? "is-open" : ""}`}>
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

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
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
          <form action={signOutAction}>
            <button className="nav-item nav-item-logout" type="submit">
              <LogOut size={18} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="dashboard-wrapper">
        <header className="dashboard-header">
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

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
