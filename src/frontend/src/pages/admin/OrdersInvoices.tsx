import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Download,
  MapPin,
  Package,
  Printer,
  Search,
  Truck,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Order } from "../../backend.d";
import { OrderStatus } from "../../backend.d";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  mockCompanyProfile,
  mockOrders,
} from "../../mockData";

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  pending: { bg: "#fef3c7", text: "#d97706", label: "Pending" },
  accepted: { bg: "#dbeafe", text: "#2563eb", label: "Accepted" },
  delivered: { bg: "#dcfce7", text: "#16a34a", label: "Delivered" },
};

function InvoicePrint({ order }: { order: Order }) {
  const profile = mockCompanyProfile;
  const subtotal = order.totalAmount;
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  return (
    <div
      id={`invoice-${order.id}`}
      className="print-only"
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: 12,
        color: "#000",
        maxWidth: 700,
        margin: "0 auto",
        padding: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "2px solid #f97316",
          paddingBottom: 12,
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#f97316",
              margin: 0,
            }}
          >
            {profile.companyName}
          </h1>
          <p style={{ margin: "4px 0 2px" }}>GST: {profile.gstNumber}</p>
          <p style={{ margin: "2px 0" }}>
            Tel: {profile.contact} | Email: {profile.email}
          </p>
          <p style={{ margin: "2px 0" }}>{profile.address}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ fontSize: 18, fontWeight: "bold", margin: 0 }}>
            TAX INVOICE
          </h2>
          <p style={{ margin: "4px 0 2px", fontWeight: "bold" }}>
            Invoice #: {order.invoiceNumber}
          </p>
          <p style={{ margin: "2px 0" }}>Date: {formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Customer */}
      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          padding: "10px 14px",
          marginBottom: 14,
        }}
      >
        <p style={{ fontWeight: "bold", marginBottom: 4 }}>Bill To:</p>
        <p style={{ fontWeight: "bold" }}>
          {order.companyName} (Store: {order.storeNumber})
        </p>
        <p>{order.address}</p>
      </div>

      {/* Items Table */}
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}
      >
        <thead>
          <tr style={{ background: "#f97316", color: "white" }}>
            <th style={{ padding: "6px 8px", textAlign: "left" }}>Sr.</th>
            <th style={{ padding: "6px 8px", textAlign: "left" }}>Product</th>
            <th style={{ padding: "6px 8px", textAlign: "center" }}>Unit</th>
            <th style={{ padding: "6px 8px", textAlign: "center" }}>Qty</th>
            <th style={{ padding: "6px 8px", textAlign: "right" }}>Rate</th>
            <th style={{ padding: "6px 8px", textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr
              key={item.productName}
              style={{ borderBottom: "1px solid #e5e7eb" }}
            >
              <td style={{ padding: "5px 8px" }}>{i + 1}</td>
              <td style={{ padding: "5px 8px" }}>{item.productName}</td>
              <td style={{ padding: "5px 8px", textAlign: "center" }}>
                {item.unit}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "center" }}>
                {item.quantity}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right" }}>
                {formatCurrency(item.rate)}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right" }}>
                {formatCurrency(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 14,
        }}
      >
        <table style={{ width: 250 }}>
          <tbody>
            <tr>
              <td style={{ padding: "3px 8px" }}>Subtotal:</td>
              <td style={{ textAlign: "right", padding: "3px 8px" }}>
                {formatCurrency(subtotal)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "3px 8px" }}>GST (5%):</td>
              <td style={{ textAlign: "right", padding: "3px 8px" }}>
                {formatCurrency(gst)}
              </td>
            </tr>
            <tr style={{ fontWeight: "bold", borderTop: "2px solid #000" }}>
              <td style={{ padding: "5px 8px" }}>Total:</td>
              <td style={{ textAlign: "right", padding: "5px 8px" }}>
                {formatCurrency(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Banking */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          padding: "10px 14px",
          marginBottom: 14,
        }}
      >
        <p style={{ fontWeight: "bold", marginBottom: 6 }}>Payment Details:</p>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}
        >
          <p>Bank: {profile.bankName}</p>
          <p>A/C No: {profile.bankAccountNumber}</p>
          <p>IFSC: {profile.ifscCode}</p>
          <p>UPI: {profile.upiId}</p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderTop: "1px solid #e5e7eb",
          paddingTop: 12,
        }}
      >
        <div>
          <p style={{ color: "#6b7280", fontSize: 11 }}>
            {profile.companyName} | {profile.address}
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              height: 40,
              borderBottom: "1px solid #000",
              width: 150,
              marginBottom: 4,
            }}
          />
          <p style={{ fontSize: 11 }}>Authorised Signatory</p>
          <p style={{ fontSize: 11, fontWeight: "bold" }}>
            {profile.companyName}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrdersInvoices() {
  const [orders, setOrders] = useState<Order[]>(() =>
    mockOrders.map((o) => ({ ...o })),
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = orders
    .filter((o) => statusFilter === "all" || o.status === statusFilter)
    .filter(
      (o) =>
        o.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.companyName.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders((os) =>
      os.map((o) =>
        o.id === id
          ? {
              ...o,
              status,
              deliveredAt:
                status === OrderStatus.delivered
                  ? BigInt(Date.now())
                  : o.deliveredAt,
            }
          : o,
      ),
    );
    toast.success(
      `Order ${status === OrderStatus.accepted ? "accepted" : "marked as delivered"}!`,
    );
  };

  const printInvoice = (order: Order) => {
    const el = document.getElementById(`invoice-${order.id}`);
    if (!el) return;
    const printContents = el.innerHTML;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(
      `<html><head><title>Invoice ${order.invoiceNumber}</title><style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px;}</style></head><body>${printContents}</body></html>`,
    );
    win.document.close();
    win.print();
  };

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === OrderStatus.pending).length,
    accepted: orders.filter((o) => o.status === OrderStatus.accepted).length,
    delivered: orders.filter((o) => o.status === OrderStatus.delivered).length,
  };

  return (
    <div data-ocid="orders.section" className="p-4 lg:p-6 space-y-4">
      {/* Hidden invoice prints */}
      <div className="hidden" ref={printRef}>
        {orders.map((o) => (
          <InvoicePrint key={o.id} order={o} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            data-ocid="orders.search_input"
            placeholder="Search by invoice no. or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as "all" | OrderStatus)}
      >
        <TabsList
          data-ocid="orders.filter.tab"
          className="flex-wrap h-auto gap-1"
        >
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value={OrderStatus.pending}>
            Pending ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value={OrderStatus.accepted}>
            Accepted ({counts.accepted})
          </TabsTrigger>
          <TabsTrigger value={OrderStatus.delivered}>
            Delivered ({counts.delivered})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders */}
      <div className="space-y-3">
        {filtered.map((order, i) => {
          const sc = STATUS_COLORS[order.status];
          return (
            <div
              key={order.id}
              data-ocid={i < 3 ? `orders.item.${i + 1}` : undefined}
              className="bg-white rounded-xl border border-border shadow-card p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-bold text-primary">
                      {order.invoiceNumber}
                    </span>
                    <Badge
                      style={{
                        background: sc.bg,
                        color: sc.text,
                        border: "none",
                      }}
                    >
                      {sc.label}
                    </Badge>
                    {order.status === OrderStatus.delivered &&
                      order.deliveredAt && (
                        <span className="text-xs text-muted-foreground">
                          Delivered: {formatDateTime(order.deliveredAt)}
                        </span>
                      )}
                  </div>
                  <p className="font-semibold">{order.companyName}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {order.address}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Package size={12} />
                      {order.items.length} items
                    </span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    <span className="text-muted-foreground">
                      Store: {order.storeNumber}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                  {order.status === OrderStatus.pending && (
                    <Button
                      data-ocid={i === 0 ? "orders.accept.button.1" : undefined}
                      size="sm"
                      onClick={() =>
                        updateStatus(order.id, OrderStatus.accepted)
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <CheckCircle2 size={14} className="mr-1" /> Accept Order
                    </Button>
                  )}
                  {order.status === OrderStatus.accepted && (
                    <Button
                      data-ocid={
                        i === 0 ? "orders.deliver.button.1" : undefined
                      }
                      size="sm"
                      onClick={() =>
                        updateStatus(order.id, OrderStatus.delivered)
                      }
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Truck size={14} className="mr-1" /> Mark Delivered
                    </Button>
                  )}
                  <Button
                    data-ocid={
                      i === 0 ? "orders.invoice_print.button.1" : undefined
                    }
                    size="sm"
                    variant="outline"
                    onClick={() => printInvoice(order)}
                  >
                    <Printer size={14} className="mr-1" /> Print
                  </Button>
                  <Button
                    data-ocid={
                      i === 0 ? "orders.invoice_download.button.1" : undefined
                    }
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      printInvoice(order);
                      toast.success("Invoice opening for download");
                    }}
                  >
                    <Download size={14} className="mr-1" /> Invoice
                  </Button>
                </div>
              </div>

              {/* Items Accordion */}
              <details className="mt-3">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  View {order.items.length} items &rarr;
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th className="text-left px-3 py-2">Product</th>
                        <th className="text-center px-3 py-2">Unit</th>
                        <th className="text-center px-3 py-2">Qty</th>
                        <th className="text-right px-3 py-2">Rate</th>
                        <th className="text-right px-3 py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, j) => (
                        <tr
                          key={`${item.productId}-${j}`}
                          className="border-t border-border"
                        >
                          <td className="px-3 py-1.5">{item.productName}</td>
                          <td className="px-3 py-1.5 text-center">
                            {item.unit}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {formatCurrency(item.rate)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
