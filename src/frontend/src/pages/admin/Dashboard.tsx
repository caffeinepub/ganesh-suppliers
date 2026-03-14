import {
  AlertCircle,
  BarChart3,
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import {
  formatCurrency,
  mockCustomers,
  mockDashboardStats,
  mockOrders,
  mockProducts,
} from "../../mockData";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  colorClass: string;
  iconColor: string;
  dataOcid?: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  iconColor,
  dataOcid,
}: StatCardProps) {
  return (
    <div
      data-ocid={dataOcid}
      className={`rounded-xl p-5 border ${colorClass} shadow-card`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold font-display text-foreground">
            {value}
          </p>
        </div>
        <div
          className="p-2.5 rounded-xl"
          style={{ background: `${iconColor}20` }}
        >
          <Icon size={22} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const stats = mockDashboardStats;
  const pendingAmt = mockOrders
    .filter((o) => o.status !== "delivered")
    .reduce((s, o) => s + o.totalAmount, 0);

  const todayOrders = mockOrders.filter((o) => {
    const d = new Date(Number(o.createdAt));
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const cards = [
    {
      label: "Total Orders",
      value: `${stats.totalOrders}`,
      icon: ShoppingCart,
      colorClass: "stat-card-orange",
      iconColor: "#f97316",
      ocid: "dashboard.total_orders.card",
    },
    {
      label: "Today's Orders",
      value: String(todayOrders.length),
      icon: Calendar,
      colorClass: "stat-card-blue",
      iconColor: "#3b82f6",
      ocid: "dashboard.today_orders.card",
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: TrendingUp,
      colorClass: "stat-card-green",
      iconColor: "#22c55e",
      ocid: "dashboard.today_revenue.card",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: BarChart3,
      colorClass: "stat-card-orange",
      iconColor: "#f97316",
    },
    {
      label: "Pending Amount",
      value: formatCurrency(pendingAmt),
      icon: AlertCircle,
      colorClass: "stat-card-red",
      iconColor: "#ef4444",
    },
    {
      label: "Total Customers",
      value: String(Number(stats.totalCustomers)),
      icon: UserCheck,
      colorClass: "stat-card-purple",
      iconColor: "#a855f7",
    },
    {
      label: "Total Products",
      value: String(mockProducts.length),
      icon: Package,
      colorClass: "stat-card-teal",
      iconColor: "#14b8a6",
    },
    {
      label: "Revenue This Month",
      value: formatCurrency(stats.todayRevenue * 22),
      icon: DollarSign,
      colorClass: "stat-card-green",
      iconColor: "#22c55e",
    },
  ];

  const recentOrders = [...mockOrders]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 5);

  const statusColor: Record<string, string> = {
    pending: "#f59e0b",
    accepted: "#3b82f6",
    delivered: "#22c55e",
  };

  return (
    <div data-ocid="dashboard.section" className="p-4 lg:p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            colorClass={card.colorClass}
            iconColor={card.iconColor}
            dataOcid={card.ocid}
          />
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-border shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold font-display">
            Recent Orders
          </h2>
          <p className="text-sm text-muted-foreground">
            Latest 5 orders across all customers
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Invoice
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Company
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">
                  Items
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                  Amount
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-primary font-medium">
                    {order.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 font-medium">{order.companyName}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {order.items.length} items
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: `${statusColor[order.status]}20`,
                        color: statusColor[order.status],
                      }}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <h3 className="font-semibold font-display mb-4">Customer Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Active Customers
              </span>
              <span className="font-bold text-green-600">
                {mockCustomers.filter((c) => c.isActive).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Inactive Customers
              </span>
              <span className="font-bold text-red-500">
                {mockCustomers.filter((c) => !c.isActive).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Registered
              </span>
              <span className="font-bold">{mockCustomers.length}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <h3 className="font-semibold font-display mb-4">Order Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="font-bold" style={{ color: "#f59e0b" }}>
                {mockOrders.filter((o) => o.status === "pending").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Accepted</span>
              <span className="font-bold" style={{ color: "#3b82f6" }}>
                {mockOrders.filter((o) => o.status === "accepted").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Delivered</span>
              <span className="font-bold" style={{ color: "#22c55e" }}>
                {mockOrders.filter((o) => o.status === "delivered").length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
