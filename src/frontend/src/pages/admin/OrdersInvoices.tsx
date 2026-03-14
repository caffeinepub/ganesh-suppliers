import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Download,
  MapPin,
  Package,
  Printer,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Order } from "../../backend.d";
import { OrderStatus } from "../../backend.d";
import { useDataStore } from "../../dataStore";
import { formatCurrency, formatDate, formatDateTime } from "../../mockData";

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  pending: { bg: "#fef3c7", text: "#d97706", label: "Pending" },
  accepted: { bg: "#dbeafe", text: "#2563eb", label: "Accepted" },
  delivered: { bg: "#dcfce7", text: "#16a34a", label: "Delivered" },
  deleted: { bg: "#fee2e2", text: "#dc2626", label: "Deleted" },
};

function InvoicePrint({ order }: { order: Order }) {
  const { profile } = useDataStore();
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
  const {
    orders,
    updateOrderStatus: storeUpdateStatus,
    deleteOrder,
  } = useDataStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | OrderStatus | "deleted"
  >("all");
  const printRef = useRef<HTMLDivElement>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const filtered = orders
    .filter((o) => {
      if (statusFilter === "deleted") return (o as any).isDeleted === true;
      if (statusFilter === "all") return true;
      return o.status === statusFilter && !(o as any).isDeleted;
    })
    .filter(
      (o) =>
        o.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.companyName.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  const updateStatus = (id: string, status: OrderStatus) => {
    storeUpdateStatus(id, status);
  };

  const openDeleteDialog = (orderId: string) => {
    setDeleteTargetId(orderId);
    setDeleteReason("");
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteReason.trim()) {
      toast.error("Please enter a reason for deletion");
      return;
    }
    deleteOrder(deleteTargetId, deleteReason.trim());
    setDeleteDialogOpen(false);
    setDeleteTargetId("");
    setDeleteReason("");
    toast.success(
      "Order deleted. It will still appear in records but excluded from accounts.",
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

  const deletedCount = orders.filter((o) => (o as any).isDeleted).length;
  const activeOrders = orders.filter((o) => !(o as any).isDeleted);

  const counts = {
    all: activeOrders.length,
    pending: activeOrders.filter((o) => o.status === OrderStatus.pending)
      .length,
    accepted: activeOrders.filter((o) => o.status === OrderStatus.accepted)
      .length,
    delivered: activeOrders.filter((o) => o.status === OrderStatus.delivered)
      .length,
    deleted: deletedCount,
  };

  return (
    <div data-ocid="orders.section" className="p-4 lg:p-6 space-y-4">
      {/* Hidden invoice prints */}
      <div className="hidden" ref={printRef}>
        {orders.map((o) => (
          <InvoicePrint key={o.id} order={o} />
        ))}
      </div>

      {/* Delete Order Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent data-ocid="orders.delete.dialog">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Order</DialogTitle>
            <DialogDescription>
              This order will be marked as deleted and removed from account
              statements. It will still be visible in the admin and customer
              portal with a "Deleted" status. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="delete-reason" className="font-semibold">
              Reason for Deletion <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="delete-reason"
              data-ocid="orders.delete.reason_input"
              placeholder="Enter reason (e.g. Duplicate order, Customer cancelled, Data entry error...)"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="orders.delete.cancel_button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="orders.delete.confirm_button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={!deleteReason.trim()}
            >
              <Trash2 size={14} className="mr-1" /> Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        onValueChange={(v) =>
          setStatusFilter(v as "all" | OrderStatus | "deleted")
        }
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
          {deletedCount > 0 && (
            <TabsTrigger value="deleted" className="text-red-600">
              Deleted ({counts.deleted})
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {/* Orders */}
      <div className="space-y-3">
        {filtered.map((order, i) => {
          const isDeleted = (order as any).isDeleted === true;
          const sc = isDeleted
            ? STATUS_COLORS.deleted
            : STATUS_COLORS[order.status] || STATUS_COLORS.pending;
          return (
            <div
              key={order.id}
              data-ocid={i < 3 ? `orders.item.${i + 1}` : undefined}
              className="bg-white rounded-xl border border-border shadow-card p-4"
              style={isDeleted ? { opacity: 0.75, borderColor: "#fecaca" } : {}}
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
                      order.deliveredAt &&
                      !isDeleted && (
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
                  {isDeleted && (order as any).deleteReason && (
                    <div
                      className="mt-2 px-3 py-2 rounded-lg text-xs"
                      style={{ background: "#fee2e2", color: "#dc2626" }}
                    >
                      <span className="font-semibold">Deletion Reason: </span>
                      {(order as any).deleteReason}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                  {!isDeleted && order.status === OrderStatus.pending && (
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
                  {!isDeleted && order.status === OrderStatus.accepted && (
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
                  {!isDeleted && (
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
                  )}
                  {!isDeleted && (
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
                      <Download size={14} className="mr-1" /> PDF
                    </Button>
                  )}
                  {!isDeleted && (
                    <Button
                      data-ocid={i === 0 ? "orders.delete_button.1" : undefined}
                      size="sm"
                      variant="outline"
                      onClick={() => openDeleteDialog(order.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div
            data-ocid="orders.empty_state"
            className="text-center py-16 rounded-xl bg-white border border-border"
          >
            <Package size={40} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
