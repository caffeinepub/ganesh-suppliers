import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import type { Customer } from "./backend.d";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import CustomerLayout from "./pages/customer/CustomerLayout";

export type AppView = "login" | "admin" | "customer";

export default function App() {
  const [view, setView] = useState<AppView>("login");
  const [loggedInCustomer, setLoggedInCustomer] = useState<Customer | null>(
    null,
  );

  if (view === "admin") {
    return (
      <>
        <AdminLayout onLogout={() => setView("login")} />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  if (view === "customer" && loggedInCustomer) {
    return (
      <>
        <CustomerLayout
          customer={loggedInCustomer}
          onLogout={() => {
            setView("login");
            setLoggedInCustomer(null);
          }}
        />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  return (
    <>
      <LoginPage
        onAdminLogin={() => setView("admin")}
        onCustomerLogin={(customer) => {
          setLoggedInCustomer(customer);
          setView("customer");
        }}
      />
      <Toaster richColors position="top-right" />
    </>
  );
}
