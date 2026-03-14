import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Download, Printer } from "lucide-react";
import { useState } from "react";
import type { Customer } from "../../backend.d";
import { useDataStore } from "../../dataStore";
import { formatCurrency, formatDate, formatDateTime } from "../../mockData";

interface Props {
  customer: Customer;
}

export default function CustomerCompletedOrders({ customer }: Props) {
  const { orders, profile } = useDataStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const completedOrders = orders
    .filter(
      (o) =>
        o.customerId === customer.id &&
        (o.status === "delivered" || (o as any).isDeleted),
    )
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getInvoiceHtml = (order: (typeof completedOrders)[0]) => {
    const pm = (order as any).paymentMethod || "pay_later";
    const pmLabel =
      pm === "upi_advance"
        ? "UPI Advance Payment"
        : pm === "cash"
          ? "Cash"
          : "Pay Later";
    const ref = (order as any).paymentReference || "";
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${order.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 30px; }
    .header { border-bottom: 2px solid #f97316; padding-bottom: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .company-name { font-size: 22px; font-weight: bold; color: #f97316; }
    .company-details { font-size: 11px; color: #64748b; margin-top: 4px; }
    .invoice-title { font-size: 18px; font-weight: bold; color: #1e293b; }
    .invoice-meta { font-size: 11px; color: #64748b; margin-top: 4px; text-align: right; }
    .customer-section { display: flex; justify-content: space-between; margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 8px; }
    .section-title { font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; border: 1px solid #e2e8f0; }
    td { padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 12px; }
    .total-row { background: #fff7ed; font-weight: bold; }
    .payment-section { margin-top: 16px; padding: 10px 12px; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0; }
    .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
    .signature { text-align: right; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${profile.companyName}</div>
      <div class="company-details">
        ${profile.address}<br>
        GST: ${profile.gstNumber} | Tel: ${profile.contact}<br>
        Email: ${profile.email}
      </div>
    </div>
    <div>
      <div class="invoice-title">TAX INVOICE</div>
      <div class="invoice-meta">
        Invoice No: ${order.invoiceNumber}<br>
        Date: ${formatDate(order.createdAt)}<br>
        ${order.deliveredAt ? `Delivered: ${formatDate(order.deliveredAt)}` : ""}
      </div>
    </div>
  </div>
  <div class="customer-section">
    <div>
      <div class="section-title">Bill To</div>
      <strong>${order.companyName}</strong><br>
      Store: ${order.storeNumber}<br>
      ${order.address}
    </div>
    <div style="text-align:right">
      <div class="section-title">Payment Method</div>
      <strong>${pmLabel}</strong>
      ${ref ? `<br>Ref: ${ref}` : ""}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th>Unit</th>
        <th>Qty</th>
        <th>Rate (₹)</th>
        <th>Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${order.items
        .map(
          (item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.productName}</td>
          <td>${item.unit}</td>
          <td>${item.quantity}</td>
          <td>${item.rate.toFixed(2)}</td>
          <td>${item.amount.toFixed(2)}</td>
        </tr>
      `,
        )
        .join("")}
      <tr class="total-row">
        <td colspan="5" style="text-align:right"><strong>Total Amount</strong></td>
        <td><strong>₹${order.totalAmount.toFixed(2)}</strong></td>
      </tr>
    </tbody>
  </table>
  <div class="payment-section">
    <strong>Bank Details:</strong> ${profile.bankName} | A/C: ${profile.bankAccountNumber} | IFSC: ${profile.ifscCode} | UPI: ${profile.upiId}
  </div>
  <div class="signature">
    <p>Authorised Signatory</p>
    <p style="margin-top: 30px; font-weight: bold;">${profile.companyName}</p>
  </div>
  <div class="footer">
    Thank you for your business! | ${profile.companyName} | ${profile.contact}
  </div>
</body>
</html>`;
  };

  const handlePrint = (order: (typeof completedOrders)[0]) => {
    const html = getInvoiceHtml(order);
    const win = window.open("", "_blank", "width=800,height=900");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const handleDownloadPdf = (order: (typeof completedOrders)[0]) => {
    const html = getInvoiceHtml(order);
    const win = window.open("", "_blank", "width=800,height=900");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  };

  const paymentBadge = (order: (typeof completedOrders)[0]) => {
    if ((order as any).isDeleted)
      return { label: "Deleted", bg: "#fee2e2", color: "#dc2626" };
    const pm = (order as any).paymentMethod || "pay_later";
    if (pm === "upi_advance")
      return { label: "UPI Advance", bg: "#dbeafe", color: "#1e40af" };
    if (pm === "cash")
      return { label: "Cash", bg: "#dcfce7", color: "#166534" };
    return { label: "Pay Later", bg: "#fef9c3", color: "#854d0e" };
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2
        className="text-xl font-bold mb-5"
        style={{
          fontFamily: "Bricolage Grotesque, sans-serif",
          color: "#1e293b",
        }}
      >
        Completed Orders
      </h2>

      {completedOrders.length === 0 ? (
        <div
          data-ocid="completed-orders.empty_state"
          className="text-center py-16 rounded-2xl"
          style={{ background: "#fff", border: "1px solid #e2e8f0" }}
        >
          <p className="text-muted-foreground">No completed orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {completedOrders.map((order, idx) => {
            const badge = paymentBadge(order);
            const isExpanded = expanded.has(order.id);
            return (
              <div
                key={order.id}
                data-ocid={`completed-orders.item.${idx + 1}`}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "#fff",
                  border: (order as any).isDeleted
                    ? "1px solid #fecaca"
                    : "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  opacity: (order as any).isDeleted ? 0.8 : 1,
                }}
              >
                <div className="p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold" style={{ color: "#1e293b" }}>
                      {order.invoiceNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                      {order.deliveredAt
                        ? ` · Delivered: ${formatDate(order.deliveredAt)}`
                        : ""}
                    </p>
                    {(order as any).isDeleted &&
                      (order as any).deleteReason && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: "#dc2626" }}
                        >
                          Deleted: {(order as any).deleteReason}
                        </p>
                      )}
                  </div>
                  <Badge
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      border: "none",
                    }}
                  >
                    {badge.label}
                  </Badge>
                  <span
                    className="font-bold text-lg"
                    style={{
                      color: "#1e293b",
                      fontFamily: "Bricolage Grotesque, sans-serif",
                    }}
                  >
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <div className="flex items-center gap-2">
                    {!(order as any).isDeleted && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`completed-orders.print.button.${idx + 1}`}
                          onClick={() => handlePrint(order)}
                          className="h-8 gap-1.5"
                        >
                          <Printer size={14} /> Print
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`completed-orders.download.button.${idx + 1}`}
                          onClick={() => handleDownloadPdf(order)}
                          className="h-8 gap-1.5"
                        >
                          <Download size={14} /> PDF
                        </Button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleExpand(order.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ borderTop: "1px solid #f1f5f9" }}>
                    <table className="w-full text-sm">
                      <thead style={{ background: "#f8fafc" }}>
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                            Product
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                            Unit
                          </th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                            Qty
                          </th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                            Rate
                          </th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr
                            key={item.productId}
                            style={{ borderTop: "1px solid #f1f5f9" }}
                          >
                            <td
                              className="px-4 py-2.5"
                              style={{ color: "#1e293b" }}
                            >
                              {item.productName}
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground">
                              {item.unit}
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">
                              {formatCurrency(item.rate)}
                            </td>
                            <td
                              className="px-4 py-2.5 text-right font-medium"
                              style={{ color: "#1e293b" }}
                            >
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
