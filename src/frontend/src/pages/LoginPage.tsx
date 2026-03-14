import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Customer } from "../backend.d";
import { mockCustomers } from "../mockData";

type LoginMode = "landing" | "admin" | "customer";

interface Props {
  onAdminLogin: () => void;
  onCustomerLogin: (customer: Customer) => void;
}

export default function LoginPage({ onAdminLogin, onCustomerLogin }: Props) {
  const [mode, setMode] = useState<LoginMode>("landing");
  const [phase, setPhase] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });
  const [customerForm, setCustomerForm] = useState({
    storeNumber: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1400);
    const t4 = setTimeout(() => setPhase(4), 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    if (
      adminForm.email === "admin@ganeshsuppliers.com" &&
      adminForm.password === "Admin@1234"
    ) {
      toast.success("Welcome back, Admin!");
      onAdminLogin();
    } else {
      toast.error(
        "Invalid credentials. Use admin@ganeshsuppliers.com / Admin@1234",
      );
    }
    setLoading(false);
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const customer = mockCustomers.find(
      (c) =>
        c.storeNumber === customerForm.storeNumber &&
        c.passwordHash === customerForm.password,
    );
    if (customer) {
      if (!customer.isActive) {
        toast.error("Your account is inactive. Contact admin.");
      } else {
        toast.success(`Welcome, ${customer.companyName}!`);
        onCustomerLogin(customer);
      }
    } else {
      toast.error("Invalid store number or password.");
    }
    setLoading(false);
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
  };

  const labelStyle = { color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e1b2e 40%, #0f1923 100%)",
      }}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{
            background: "radial-gradient(circle, #f97316, transparent)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-5"
          style={{
            background: "radial-gradient(circle, #f97316, transparent)",
          }}
        />
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{
            background:
              "linear-gradient(90deg, transparent, #f97316, transparent)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-1"
          style={{
            background:
              "linear-gradient(90deg, transparent, #f97316, transparent)",
          }}
        />
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>Background grid pattern</title>
          <defs>
            <pattern
              id="grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {mode === "landing" && (
          <div className="text-center">
            {/* Logo */}
            <div
              className="mx-auto mb-6 w-24 h-24 rounded-2xl overflow-hidden transition-all duration-700"
              style={{
                opacity: phase >= 1 ? 1 : 0,
                transform: phase >= 1 ? "scale(1)" : "scale(0.5)",
                boxShadow: "0 0 40px rgba(249,115,22,0.3)",
              }}
            >
              <img
                src="/assets/generated/ganesh-suppliers-logo-transparent.dim_300x300.png"
                alt="Ganesh Suppliers"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Company name */}
            <div
              className="transition-all duration-700"
              style={{
                opacity: phase >= 2 ? 1 : 0,
                transform: phase >= 2 ? "translateY(0)" : "translateY(20px)",
              }}
            >
              <h1
                className="text-3xl font-bold"
                style={{
                  color: "#f97316",
                  fontFamily: "Bricolage Grotesque, sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                Ganesh Suppliers
              </h1>
              <p
                className="mt-1 text-sm"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Wholesale Vegetable Distributors
              </p>
            </div>

            {/* Version */}
            <div
              className="mt-3 transition-all duration-500"
              style={{ opacity: phase >= 3 ? 1 : 0 }}
            >
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  background: "rgba(249,115,22,0.1)",
                  border: "1px solid rgba(249,115,22,0.2)",
                  color: "rgba(249,115,22,0.8)",
                }}
              >
                v1.0.0
              </span>
            </div>

            {/* Buttons */}
            <div
              className="mt-10 flex flex-col gap-4 transition-all duration-700"
              style={{
                opacity: phase >= 4 ? 1 : 0,
                transform: phase >= 4 ? "translateY(0)" : "translateY(30px)",
              }}
            >
              <button
                type="button"
                data-ocid="login.admin.button"
                onClick={() => setMode("admin")}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  color: "#fff",
                  boxShadow: "0 8px 32px rgba(249,115,22,0.35)",
                }}
              >
                <ShieldCheck size={20} />
                Admin Login
              </button>
              <button
                type="button"
                data-ocid="login.customer.button"
                onClick={() => setMode("customer")}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                <Store size={20} />
                Customer Login
              </button>
            </div>
          </div>
        )}

        {mode === "admin" && (
          <div>
            <button
              type="button"
              data-ocid="login.back.button"
              onClick={() => setMode("landing")}
              className="flex items-center gap-2 mb-6 text-sm transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div
              className="p-8 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(249,115,22,0.15)" }}
                >
                  <ShieldCheck size={20} style={{ color: "#f97316" }} />
                </div>
                <div>
                  <h2
                    className="text-lg font-bold"
                    style={{
                      color: "#fff",
                      fontFamily: "Bricolage Grotesque, sans-serif",
                    }}
                  >
                    Admin Login
                  </h2>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Ganesh Suppliers Admin Portal
                  </p>
                </div>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <Label style={labelStyle}>Email</Label>
                  <Input
                    data-ocid="admin.login.input"
                    type="email"
                    placeholder="admin@ganeshsuppliers.com"
                    value={adminForm.email}
                    onChange={(e) =>
                      setAdminForm((p) => ({ ...p, email: e.target.value }))
                    }
                    style={inputStyle}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label style={labelStyle}>Password</Label>
                  <div className="relative">
                    <Input
                      data-ocid="admin.login.password.input"
                      type={showPass ? "text" : "password"}
                      placeholder="Admin@1234"
                      value={adminForm.password}
                      onChange={(e) =>
                        setAdminForm((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                      style={inputStyle}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPass((p) => !p)}
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button
                  data-ocid="admin.login.submit_button"
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  {loading ? "Signing in..." : "Sign In as Admin"}
                </Button>
              </form>
              <p
                className="mt-4 text-xs text-center"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Default: admin@ganeshsuppliers.com / Admin@1234
              </p>
            </div>
          </div>
        )}

        {mode === "customer" && (
          <div>
            <button
              type="button"
              data-ocid="login.back.button"
              onClick={() => setMode("landing")}
              className="flex items-center gap-2 mb-6 text-sm transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div
              className="p-8 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(249,115,22,0.1)" }}
                >
                  <Store size={20} style={{ color: "#f97316" }} />
                </div>
                <div>
                  <h2
                    className="text-lg font-bold"
                    style={{
                      color: "#fff",
                      fontFamily: "Bricolage Grotesque, sans-serif",
                    }}
                  >
                    Customer Login
                  </h2>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Enter your store credentials
                  </p>
                </div>
              </div>
              <form onSubmit={handleCustomerLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <Label style={labelStyle}>Store Number</Label>
                  <Input
                    data-ocid="customer.login.input"
                    placeholder="e.g. STR001"
                    value={customerForm.storeNumber}
                    onChange={(e) =>
                      setCustomerForm((p) => ({
                        ...p,
                        storeNumber: e.target.value,
                      }))
                    }
                    style={inputStyle}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label style={labelStyle}>Password</Label>
                  <div className="relative">
                    <Input
                      data-ocid="customer.login.password.input"
                      type={showPass ? "text" : "password"}
                      placeholder="Enter your password"
                      value={customerForm.password}
                      onChange={(e) =>
                        setCustomerForm((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                      style={inputStyle}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPass((p) => !p)}
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button
                  data-ocid="customer.login.submit_button"
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <p
                className="mt-4 text-xs text-center"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Use your Store Number and password provided by admin
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
