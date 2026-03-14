import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import type { Customer } from "../../backend.d";
import { getAllOrdersWithCustomer } from "../../customerOrderStore";
import {
  formatCurrency,
  formatDate,
  mockCompanyProfile,
  mockPayments,
} from "../../mockData";

interface Props {
  customer: Customer;
}

type QuickRange =
  | "this-month"
  | "last-month"
  | "3-months"
  | "1-year"
  | "custom";

export default function CustomerStatement({ customer }: Props) {
  const today = new Date();
  const [quickRange, setQuickRange] = useState<QuickRange>("this-month");
  const [fromDate, setFromDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`,
  );
  const [toDate, setToDate] = useState(today.toISOString().split("T")[0]);

  const applyQuickRange = (range: QuickRange) => {
    setQuickRange(range);
    const now = new Date();
    const toD = now.toISOString().split("T")[0];
    if (range === "this-month") {
      setFromDate(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
      );
      setToDate(toD);
    } else if (range === "last-month") {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lme = new Date(now.getFullYear(), now.getMonth(), 0);
      setFromDate(lm.toISOString().split("T")[0]);
      setToDate(lme.toISOString().split("T")[0]);
    } else if (range === "3-months") {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      setFromDate(start.toISOString().split("T")[0]);
      setToDate(toD);
    } else if (range === "1-year") {
      const start = new Date(now);
      start.setDate(start.getDate() - 365);
      setFromDate(start.toISOString().split("T")[0]);
      setToDate(toD);
    }
  };

  const from = new Date(fromDate);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  const allOrders = getAllOrdersWithCustomer();
  const customerOrders = allOrders
    .filter((o) => o.customerId === customer.id)
    .filter((o) => {
      const d = new Date(Number(o.createdAt));
      return d >= from && d <= to;
    })
    .sort((a, b) => Number(a.createdAt) - Number(b.createdAt));

  const customerPayments = mockPayments
    .filter((p) => p.customerId === customer.id)
    .filter((p) => {
      const d = new Date(Number(p.recordedAt));
      return d >= from && d <= to;
    })
    .sort((a, b) => Number(a.recordedAt) - Number(b.recordedAt));

  // Build ledger rows
  const ledgerRows = useMemo(() => {
    type LedgerRow = {
      date: bigint | number;
      description: string;
      invoiceNumber: string;
      debit: number;
      credit: number;
    };
    const rows: LedgerRow[] = [];
    for (const o of customerOrders) {
      rows.push({
        date: o.createdAt,
        description: `Order - ${o.companyName}`,
        invoiceNumber: o.invoiceNumber,
        debit: o.totalAmount,
        credit: 0,
      });
    }
    for (const p of customerPayments) {
      rows.push({
        date: p.recordedAt,
        description: `Payment - ${p.paymentMethod}${p.referenceNumber ? ` (Ref: ${p.referenceNumber})` : ""}`,
        invoiceNumber: "",
        debit: 0,
        credit: p.amount,
      });
    }
    rows.sort((a, b) => Number(a.date) - Number(b.date));
    return rows;
  }, [customerOrders, customerPayments]);

  let runningBalance = 0;
  const totalDebit = ledgerRows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = ledgerRows.reduce((s, r) => s + r.credit, 0);
  const netBalance = totalDebit - totalCredit;

  const getStatementHtml = () => {
    let balance = 0;
    const rows = ledgerRows
      .map((row) => {
        balance += row.debit - row.credit;
        return `<tr>
          <td>${formatDate(row.date)}</td>
          <td>${row.description}</td>
          <td>${row.invoiceNumber}</td>
          <td style="text-align:right">${row.debit > 0 ? `₹${row.debit.toFixed(2)}` : ""}</td>
          <td style="text-align:right">${row.credit > 0 ? `₹${row.credit.toFixed(2)}` : ""}</td>
          <td style="text-align:right;color:${balance > 0 ? "#dc2626" : "#16a34a"}">₹${Math.abs(balance).toFixed(2)} ${balance > 0 ? "Dr" : "Cr"}</td>
        </tr>`;
      })
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Statement - ${customer.companyName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 30px; }
    .header { border-bottom: 2px solid #f97316; padding-bottom: 14px; margin-bottom: 14px; display: flex; justify-content: space-between; }
    .company-name { font-size: 20px; font-weight: bold; color: #f97316; }
    .company-details { font-size: 10px; color: #64748b; margin-top: 4px; }
    .statement-title { font-size: 16px; font-weight: bold; }
    .meta { font-size: 11px; color: #64748b; text-align: right; margin-top: 4px; }
    .customer-section { padding: 10px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; }
    th { background: #f1f5f9; padding: 7px 10px; text-align: left; font-size: 10px; font-weight: 600; color: #64748b; border: 1px solid #e2e8f0; }
    td { padding: 7px 10px; border: 1px solid #e2e8f0; font-size: 11px; }
    .total-row { background: #fff7ed; font-weight: bold; }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${mockCompanyProfile.companyName}</div>
      <div class="company-details">${mockCompanyProfile.address}<br>GST: ${mockCompanyProfile.gstNumber} | Tel: ${mockCompanyProfile.contact}</div>
    </div>
    <div>
      <div class="statement-title">ACCOUNT STATEMENT</div>
      <div class="meta">Period: ${fromDate} to ${toDate}<br>Generated: ${new Date().toLocaleDateString("en-IN")}</div>
    </div>
  </div>
  <div class="customer-section">
    <strong>${customer.companyName}</strong> | Store: ${customer.storeNumber} | ${customer.address}
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Invoice #</th>
        <th style="text-align:right">Debit (₹)</th>
        <th style="text-align:right">Credit (₹)</th>
        <th style="text-align:right">Balance</th>
      </tr>
    </thead>
    <tbody>
      <tr><td colspan="5"><strong>Opening Balance</strong></td><td style="text-align:right">₹0.00</td></tr>
      ${rows}
      <tr class="total-row">
        <td colspan="2"><strong>Closing Balance</strong></td>
        <td></td>
        <td style="text-align:right"><strong>₹${totalDebit.toFixed(2)}</strong></td>
        <td style="text-align:right"><strong>₹${totalCredit.toFixed(2)}</strong></td>
        <td style="text-align:right;color:${netBalance > 0 ? "#dc2626" : "#16a34a"}"><strong>₹${Math.abs(netBalance).toFixed(2)} ${netBalance > 0 ? "Dr" : "Cr"}</strong></td>
      </tr>
    </tbody>
  </table>
  <div class="footer">
    ${mockCompanyProfile.companyName} | ${mockCompanyProfile.contact} | ${mockCompanyProfile.email}
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = getStatementHtml();
    const win = window.open("", "_blank", "width=900,height=900");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const handleDownloadPdf = () => {
    const html = getStatementHtml();
    const win = window.open("", "_blank", "width=900,height=900");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  };

  const quickRanges: Array<{ id: QuickRange; label: string }> = [
    { id: "this-month", label: "This Month" },
    { id: "last-month", label: "Last Month" },
    { id: "3-months", label: "3 Months" },
    { id: "1-year", label: "Last 366 Days" },
    { id: "custom", label: "Custom" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h2
          className="text-xl font-bold"
          style={{
            fontFamily: "Bricolage Grotesque, sans-serif",
            color: "#1e293b",
          }}
        >
          My Statement
        </h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            data-ocid="statement.print.button"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <Printer size={14} /> Print
          </Button>
          <Button
            size="sm"
            variant="outline"
            data-ocid="statement.download.button"
            onClick={handleDownloadPdf}
            className="gap-1.5"
          >
            <Download size={14} /> Download PDF
          </Button>
        </div>
      </div>

      {/* Quick range + date pickers */}
      <div
        className="rounded-xl p-4 mb-5"
        style={{ background: "#fff", border: "1px solid #e2e8f0" }}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {quickRanges.map((r) => (
            <button
              type="button"
              key={r.id}
              data-ocid={`statement.range.${r.id}.tab`}
              onClick={() => applyQuickRange(r.id)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: quickRange === r.id ? "#f97316" : "#f1f5f9",
                color: quickRange === r.id ? "#fff" : "#64748b",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="from-date"
              className="text-sm font-medium"
              style={{ color: "#1e293b" }}
            >
              From:
            </label>
            <input
              id="from-date"
              data-ocid="statement.from.input"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setQuickRange("custom");
              }}
              className="border rounded-lg px-3 py-1.5 text-sm"
              style={{ borderColor: "#e2e8f0" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="to-date"
              className="text-sm font-medium"
              style={{ color: "#1e293b" }}
            >
              To:
            </label>
            <input
              id="to-date"
              data-ocid="statement.to.input"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setQuickRange("custom");
              }}
              className="border rounded-lg px-3 py-1.5 text-sm"
              style={{ borderColor: "#e2e8f0" }}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div
          className="rounded-xl p-4"
          style={{ background: "#fff", border: "1px solid #e2e8f0" }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Total Purchases
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{
              color: "#ef4444",
              fontFamily: "Bricolage Grotesque, sans-serif",
            }}
          >
            {formatCurrency(totalDebit)}
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: "#fff", border: "1px solid #e2e8f0" }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Total Payments
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{
              color: "#10b981",
              fontFamily: "Bricolage Grotesque, sans-serif",
            }}
          >
            {formatCurrency(totalCredit)}
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: "#fff", border: "1px solid #e2e8f0" }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Net Balance Due
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{
              color: netBalance > 0 ? "#ef4444" : "#10b981",
              fontFamily: "Bricolage Grotesque, sans-serif",
            }}
          >
            {formatCurrency(Math.abs(netBalance))}
            <span className="text-sm font-normal ml-1">
              {netBalance > 0 ? "Dr" : "Cr"}
            </span>
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid #e2e8f0" }}
      >
        {ledgerRows.length === 0 ? (
          <div data-ocid="statement.empty_state" className="text-center py-16">
            <p className="text-muted-foreground">
              No transactions in this period.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Invoice #
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Debit (₹)
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Credit (₹)
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  style={{
                    background: "#f0fdf4",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <td
                    colSpan={5}
                    className="px-4 py-2.5 font-medium text-muted-foreground"
                  >
                    Opening Balance
                  </td>
                  <td
                    className="px-4 py-2.5 text-right font-medium"
                    style={{ color: "#10b981" }}
                  >
                    ₹0.00
                  </td>
                </tr>
                {ledgerRows.map((row, idx) => {
                  runningBalance += row.debit - row.credit;
                  return (
                    <tr
                      key={`${row.description}-${String(row.date)}`}
                      data-ocid={`statement.item.${idx + 1}`}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: "#1e293b" }}>
                        {row.description}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {row.invoiceNumber}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right font-medium"
                        style={{ color: row.debit > 0 ? "#ef4444" : "#94a3b8" }}
                      >
                        {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right font-medium"
                        style={{
                          color: row.credit > 0 ? "#10b981" : "#94a3b8",
                        }}
                      >
                        {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right font-semibold"
                        style={{
                          color: runningBalance > 0 ? "#ef4444" : "#10b981",
                        }}
                      >
                        {formatCurrency(Math.abs(runningBalance))}
                        <span className="text-xs ml-0.5">
                          {runningBalance > 0 ? "Dr" : "Cr"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr
                  style={{
                    background: "#fff7ed",
                    borderTop: "2px solid #fed7aa",
                  }}
                >
                  <td
                    colSpan={3}
                    className="px-4 py-3 font-bold"
                    style={{ color: "#1e293b" }}
                  >
                    Closing Balance
                  </td>
                  <td
                    className="px-4 py-3 text-right font-bold"
                    style={{ color: "#ef4444" }}
                  >
                    {formatCurrency(totalDebit)}
                  </td>
                  <td
                    className="px-4 py-3 text-right font-bold"
                    style={{ color: "#10b981" }}
                  >
                    {formatCurrency(totalCredit)}
                  </td>
                  <td
                    className="px-4 py-3 text-right font-bold text-base"
                    style={{
                      color: netBalance > 0 ? "#ef4444" : "#10b981",
                    }}
                  >
                    {formatCurrency(Math.abs(netBalance))}
                    <span className="text-xs ml-0.5">
                      {netBalance > 0 ? "Dr" : "Cr"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
