import { Package, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import type { Customer } from "../../backend.d";
import { useDataStore } from "../../dataStore";
import { formatCurrency, formatDate } from "../../mockData";
import type { CustomerSection } from "./CustomerLayout";

interface Props {
  customer: Customer;
  onNavigate: (section: CustomerSection) => void;
}

export default function CustomerDashboard({ customer, onNavigate }: Props) {
  const { orders, payments } = useDataStore();
  const customerOrders = orders.filter((o) => o.customerId === customer.id);
  const totalPurchase = customerOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalPaid = payments
    .filter((p) => p.customerId === customer.id)
    .reduce((s, p) => s + p.amount, 0);
  const balanceDue = totalPurchase - totalPaid;
  const recentOrders = [...customerOrders]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 5);

  const statusColor = (s: string) => {
    if (s === "delivered") return { background: "#dcfce7", color: "#166534" };
    if (s === "accepted") return { background: "#dbeafe", color: "#1e40af" };
    return { background: "#fef9c3", color: "#854d0e" };
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Customer Header */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        <h1
          className="text-2xl font-bold"
          style={{
            color: "#f97316",
            fontFamily: "Bricolage Grotesque, sans-serif",
          }}
        >
          {customer.companyName}
        </h1>
        <div
          className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          <span>🏪 Store: {customer.storeNumber}</span>
          <span>📞 {customer.phone}</span>
          <span className="sm:col-span-2">📍 {customer.address}</span>
          {customer.gstNumber && <span>🧾 GST: {customer.gstNumber}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div
          data-ocid="dashboard.total-orders.card"
          className="rounded-xl p-5 flex items-start gap-4"
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(249,115,22,0.1)" }}
          >
            <Package size={20} style={{ color: "#f97316" }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Total Orders
            </p>
            <p
              className="text-3xl font-bold mt-0.5"
              style={{
                color: "#1e293b",
                fontFamily: "Bricolage Grotesque, sans-serif",
              }}
            >
              {customerOrders.length}
            </p>
          </div>
        </div>
        <div
          data-ocid="dashboard.total-purchase.card"
          className="rounded-xl p-5 flex items-start gap-4"
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(16,185,129,0.1)" }}
          >
            <TrendingUp size={20} style={{ color: "#10b981" }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Total Purchase
            </p>
            <p
              className="text-2xl font-bold mt-0.5"
              style={{
                color: "#1e293b",
                fontFamily: "Bricolage Grotesque, sans-serif",
              }}
            >
              {formatCurrency(totalPurchase)}
            </p>
          </div>
        </div>
        <div
          data-ocid="dashboard.balance-due.card"
          className="rounded-xl p-5 flex items-start gap-4"
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                balanceDue > 0 ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
            }}
          >
            <Wallet
              size={20}
              style={{ color: balanceDue > 0 ? "#ef4444" : "#10b981" }}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Balance Due
            </p>
            <p
              className="text-2xl font-bold mt-0.5"
              style={{
                color: balanceDue > 0 ? "#ef4444" : "#10b981",
                fontFamily: "Bricolage Grotesque, sans-serif",
              }}
            >
              {formatCurrency(balanceDue)}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-base font-semibold"
            style={{
              fontFamily: "Bricolage Grotesque, sans-serif",
              color: "#1e293b",
            }}
          >
            Recent Orders
          </h2>
          <button
            type="button"
            data-ocid="dashboard.view-orders.button"
            onClick={() => onNavigate("completed-orders")}
            className="text-xs font-medium transition-colors"
            style={{ color: "#f97316" }}
          >
            View all →
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div
            data-ocid="dashboard.orders.empty_state"
            className="text-center py-10"
          >
            <ShoppingBag
              size={36}
              className="mx-auto mb-3"
              style={{ color: "#cbd5e1" }}
            />
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <button
              type="button"
              data-ocid="dashboard.place-order.button"
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#f97316" }}
              onClick={() => onNavigate("place-order")}
            >
              Place your first order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                    Invoice
                  </th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left py-2 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => (
                  <tr
                    key={order.id}
                    data-ocid={`dashboard.orders.item.${i + 1}`}
                    style={{ borderBottom: "1px solid #f8fafc" }}
                  >
                    <td
                      className="py-2.5 pr-4 font-medium"
                      style={{ color: "#1e293b" }}
                    >
                      {order.invoiceNumber}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                    <td
                      className="py-2.5 pr-4 font-semibold"
                      style={{ color: "#1e293b" }}
                    >
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-2.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                        style={statusColor(order.status)}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
