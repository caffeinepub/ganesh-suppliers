import {
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import Accounts from "./Accounts";
import Customers from "./Customers";
import Dashboard from "./Dashboard";
import OrdersInvoices from "./OrdersInvoices";
import Products from "./Products";
import Profile from "./Profile";

export type AdminSection =
  | "dashboard"
  | "products"
  | "customers"
  | "orders"
  | "accounts"
  | "profile";

const navItems: Array<{
  id: AdminSection;
  label: string;
  icon: React.ElementType;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "orders", label: "Orders & Invoices", icon: ShoppingCart },
  { id: "accounts", label: "Accounts", icon: BookOpen },
  { id: "profile", label: "Profile", icon: UserCircle },
];

interface Props {
  onLogout: () => void;
}

export default function AdminLayout({ onLogout }: Props) {
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (s: AdminSection) => {
    setSection(s);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="button"
          tabIndex={-1}
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-64 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "#1e293b",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Sidebar Header */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src="/assets/generated/ganesh-suppliers-logo-transparent.dim_300x300.png"
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-bold truncate"
              style={{
                color: "#f97316",
                fontFamily: "Bricolage Grotesque, sans-serif",
              }}
            >
              Ganesh Suppliers
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Admin Portal
            </p>
          </div>
          <button
            type="button"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <p
            className="px-3 mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => navigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all duration-150"
                style={{
                  background: active ? "rgba(249,115,22,0.15)" : "transparent",
                  color: active ? "#f97316" : "rgba(255,255,255,0.6)",
                  borderLeft: active
                    ? "3px solid #f97316"
                    : "3px solid transparent",
                }}
              >
                <Icon size={17} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          className="px-3 pb-5"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: "1rem",
          }}
        >
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-red-500/10"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 py-3 lg:px-6 bg-white border-b border-border flex-shrink-0">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold font-display text-foreground">
              {navItems.find((n) => n.id === section)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                background: "rgba(249,115,22,0.1)",
                border: "1px solid rgba(249,115,22,0.2)",
              }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#f97316" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: "#f97316" }}
              >
                Admin
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {section === "dashboard" && <Dashboard />}
          {section === "products" && <Products />}
          {section === "customers" && <Customers />}
          {section === "orders" && <OrdersInvoices />}
          {section === "accounts" && <Accounts />}
          {section === "profile" && <Profile onGoToCustomerPortal={() => {}} />}
        </main>
      </div>
    </div>
  );
}
