import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Banknote,
  Check,
  ChevronDown,
  ChevronsUpDown,
  CreditCard,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { OrderStatus, PaymentMethod } from "../../backend.d";
import type { Order, Payment as PaymentType } from "../../backend.d";
import { useDataStore } from "../../dataStore";
import { formatCurrency, formatDate, formatDateTime } from "../../mockData";

function getQuickRange(range: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  let from = to;
  if (range === "this_month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
  } else if (range === "last_month") {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    from = lm.toISOString().split("T")[0];
  } else if (range === "last_3_months") {
    from = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      .toISOString()
      .split("T")[0];
  } else if (range === "yearly") {
    from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      .toISOString()
      .split("T")[0];
  }
  return { from, to };
}

interface StatementEntry {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

function buildStatement(
  customerId: string,
  from: string,
  to: string,
  allOrders: Order[],
  allPayments: PaymentType[],
): {
  entries: StatementEntry[];
  openingBalance: number;
  closingBalance: number;
} {
  const fromTs = new Date(from).getTime();
  const toTs = new Date(to).getTime() + 86400000;

  // Exclude deleted orders from accounts
  const deliveredOrders = allOrders.filter(
    (o) =>
      o.customerId === customerId &&
      o.status === OrderStatus.delivered &&
      !(o as any).isDeleted &&
      o.deliveredAt &&
      Number(o.deliveredAt) >= fromTs &&
      Number(o.deliveredAt) <= toTs,
  );

  const payments = allPayments.filter(
    (p) =>
      p.customerId === customerId &&
      Number(p.recordedAt) >= fromTs &&
      Number(p.recordedAt) <= toTs,
  );

  const allEntries: Array<{
    ts: number;
    type: "debit" | "credit";
    amount: number;
    description: string;
    reference: string;
  }> = [
    ...deliveredOrders.map((o) => ({
      ts: Number(o.deliveredAt!),
      type: "debit" as const,
      amount: o.totalAmount,
      description: `Invoice ${o.invoiceNumber}`,
      reference: o.invoiceNumber,
    })),
    ...payments.map((p) => ({
      ts: Number(p.recordedAt),
      type: "credit" as const,
      amount: p.amount,
      description: `Payment - ${p.paymentMethod}${p.referenceNumber ? ` (${p.referenceNumber})` : ""}`,
      reference: p.referenceNumber || "CASH",
    })),
  ].sort((a, b) => a.ts - b.ts);

  let balance = 0;
  const openingBalance = 0;
  const entries: StatementEntry[] = allEntries.map((e) => {
    if (e.type === "debit") balance += e.amount;
    else balance -= e.amount;
    return {
      date: formatDate(e.ts),
      description: e.description,
      reference: e.reference,
      debit: e.type === "debit" ? e.amount : 0,
      credit: e.type === "credit" ? e.amount : 0,
      balance,
    };
  });

  return { entries, openingBalance, closingBalance: balance };
}

// Searchable customer combobox
function CustomerCombobox({
  value,
  onValueChange,
  customers,
  placeholder = "Search customer...",
  ocid,
}: {
  value: string;
  onValueChange: (v: string) => void;
  customers: Array<{ id: string; companyName: string; storeNumber: string }>;
  placeholder?: string;
  ocid?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = customers.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-haspopup="listbox"
          aria-expanded={open}
          data-ocid={ocid}
          className="w-full justify-between mt-1 font-normal"
        >
          {selected
            ? `${selected.companyName} (${selected.storeNumber})`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Type name or store no..." />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {customers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.companyName} ${c.storeNumber}`}
                  onSelect={() => {
                    onValueChange(c.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === c.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <span className="font-medium">{c.companyName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {c.storeNumber}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function Accounts() {
  const { customers, orders, payments, addPayment, profile } = useDataStore();

  // Statement state
  const [stmtCustomer, setStmtCustomer] = useState("");
  const [stmtFrom, setStmtFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [stmtTo, setStmtTo] = useState(new Date().toISOString().split("T")[0]);
  const [stmtResult, setStmtResult] = useState<ReturnType<
    typeof buildStatement
  > | null>(null);

  // Payment Feed state
  const [payCustomer, setPayCustomer] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.cash);
  const [payRef, setPayRef] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const applyQuickRange = (range: string) => {
    const { from, to } = getQuickRange(range);
    setStmtFrom(from);
    setStmtTo(to);
  };

  const generateStatement = () => {
    if (!stmtCustomer) {
      toast.error("Please select a customer");
      return;
    }
    const result = buildStatement(
      stmtCustomer,
      stmtFrom,
      stmtTo,
      orders,
      payments,
    );
    setStmtResult(result);
  };

  const handleRecordPayment = async () => {
    if (!payCustomer) {
      toast.error("Select a customer");
      return;
    }
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    if (payMethod === PaymentMethod.online && !payRef) {
      toast.error("Enter UTR number");
      return;
    }
    if (payMethod === PaymentMethod.cheque && !payRef) {
      toast.error("Enter Cheque number");
      return;
    }
    setPayLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const customer = customers.find((c) => c.id === payCustomer);
    const np: PaymentType = {
      id: `pay${Date.now()}`,
      customerId: payCustomer,
      storeNumber: customer?.storeNumber || "",
      companyName: customer?.companyName || "",
      amount: Number(payAmount),
      paymentMethod: payMethod,
      referenceNumber: payRef,
      recordedAt: BigInt(Date.now()),
      notes: "",
    };
    addPayment(np);
    setPayAmount("");
    setPayRef("");
    toast.success("Payment recorded successfully!");
    setPayLoading(false);
  };

  const selectedCustomer = customers.find((c) => c.id === stmtCustomer);

  return (
    <div data-ocid="accounts.section" className="p-4 lg:p-6">
      <Tabs defaultValue="customer_statement">
        <TabsList className="mb-6">
          <TabsTrigger
            data-ocid="accounts.customer_statement.tab"
            value="customer_statement"
          >
            <FileText size={14} className="mr-1.5" /> Customer Statement
          </TabsTrigger>
          <TabsTrigger
            data-ocid="accounts.company_statement.tab"
            value="company_statement"
          >
            <FileText size={14} className="mr-1.5" /> Company Statement
          </TabsTrigger>
          <TabsTrigger
            data-ocid="accounts.payment_feed.tab"
            value="payment_feed"
          >
            <Banknote size={14} className="mr-1.5" /> Payment Feed
          </TabsTrigger>
        </TabsList>

        {/* Customer Statement */}
        <TabsContent value="customer_statement" className="space-y-4">
          <div className="bg-white rounded-xl border border-border shadow-card p-5 space-y-4">
            <h3 className="font-semibold font-display">
              Generate Customer Statement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Select Customer</Label>
                <CustomerCombobox
                  value={stmtCustomer}
                  onValueChange={setStmtCustomer}
                  customers={customers}
                  placeholder="Search customer..."
                  ocid="accounts.statement.customer_select"
                />
              </div>
              <div>
                <Label>From Date</Label>
                <Input
                  data-ocid="accounts.statement.from_input"
                  type="date"
                  value={stmtFrom}
                  onChange={(e) => setStmtFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  data-ocid="accounts.statement.to_input"
                  type="date"
                  value={stmtTo}
                  onChange={(e) => setStmtTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Quick Ranges */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground self-center">
                Quick:
              </span>
              {[
                ["this_month", "This Month"],
                ["last_month", "Last Month"],
                ["last_3_months", "Last 3 Months"],
                ["yearly", "Yearly (366d)"],
              ].map(([v, l]) => (
                <Button
                  key={v}
                  size="sm"
                  variant="outline"
                  onClick={() => applyQuickRange(v)}
                  className="text-xs h-7"
                >
                  {l}
                </Button>
              ))}
            </div>

            <Button
              data-ocid="accounts.statement.generate.button"
              onClick={generateStatement}
            >
              <ChevronDown size={15} className="mr-1" /> Generate Statement
            </Button>
          </div>

          {/* Statement Output */}
          {stmtResult && selectedCustomer && (
            <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
              {/* Statement Header */}
              <div
                className="p-5 border-b border-border"
                style={{ background: "#f8fafc" }}
              >
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold font-display">
                      {profile.companyName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {profile.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      GST: {profile.gstNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Account Statement</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.companyName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.storeNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stmtFrom} to {stmtTo}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tally-style Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{ background: "#1e293b", color: "white" }}>
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium">
                        Date
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium">
                        Description
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">
                        Reference
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium">
                        Debit (Dr)
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium">
                        Credit (Cr)
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening */}
                    <tr style={{ background: "#f0fdf4" }}>
                      <td className="px-4 py-2 font-medium" colSpan={5}>
                        Opening Balance
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-green-700">
                        {formatCurrency(stmtResult.openingBalance)}
                      </td>
                    </tr>
                    {stmtResult.entries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-muted-foreground"
                        >
                          No transactions in this period
                        </td>
                      </tr>
                    ) : (
                      stmtResult.entries.map((entry) => (
                        <tr
                          key={`${entry.date}-${entry.description}`}
                          className="border-t border-border hover:bg-muted/20 transition-colors"
                          style={{
                            background: entry.debit > 0 ? "#fff" : "#f0fdf4",
                          }}
                        >
                          <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                            {entry.date}
                          </td>
                          <td className="px-4 py-2 font-medium">
                            {entry.description}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground font-mono text-xs hidden sm:table-cell">
                            {entry.reference}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {entry.debit > 0 ? (
                              <span className="text-red-600 font-medium">
                                {formatCurrency(entry.debit)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {entry.credit > 0 ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(entry.credit)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td
                            className="px-4 py-2 text-right font-bold"
                            style={{
                              color: entry.balance > 0 ? "#dc2626" : "#16a34a",
                            }}
                          >
                            {formatCurrency(Math.abs(entry.balance))}{" "}
                            {entry.balance > 0 ? "Dr" : "Cr"}
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Closing */}
                    <tr
                      style={{ background: "#fef3c7", fontWeight: "bold" }}
                      className="border-t-2 border-border"
                    >
                      <td className="px-4 py-2.5" colSpan={5}>
                        Closing Balance
                      </td>
                      <td
                        className="px-4 py-2.5 text-right"
                        style={{
                          color:
                            stmtResult.closingBalance > 0
                              ? "#dc2626"
                              : "#16a34a",
                        }}
                      >
                        {formatCurrency(Math.abs(stmtResult.closingBalance))}{" "}
                        {stmtResult.closingBalance > 0 ? "Dr" : "Cr"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div
                className="p-5 border-t border-border flex flex-col sm:flex-row justify-between gap-4 text-sm"
                style={{ background: "#f8fafc" }}
              >
                <div className="text-muted-foreground">
                  {profile.companyName} | {profile.address}
                </div>
                <div className="text-right">
                  <div className="h-10 border-b border-gray-400 w-36 ml-auto mb-1" />
                  <p>Authorised Signatory</p>
                  <p className="font-semibold">{profile.companyName}</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Company Statement */}
        <TabsContent value="company_statement" className="space-y-4">
          <div className="bg-white rounded-xl border border-border shadow-card p-5 space-y-4">
            <h3 className="font-semibold font-display">
              Company-Wide Statement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={stmtFrom}
                  onChange={(e) => setStmtFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={stmtTo}
                  onChange={(e) => setStmtTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground self-center">
                Quick:
              </span>
              {[
                ["this_month", "This Month"],
                ["last_month", "Last Month"],
                ["last_3_months", "Last 3 Months"],
                ["yearly", "Yearly"],
              ].map(([v, l]) => (
                <Button
                  key={v}
                  size="sm"
                  variant="outline"
                  onClick={() => applyQuickRange(v)}
                  className="text-xs h-7"
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>

          {/* All customers merged */}
          <div className="space-y-4">
            {customers.map((customer) => {
              const result = buildStatement(
                customer.id,
                stmtFrom,
                stmtTo,
                orders,
                payments,
              );
              if (result.entries.length === 0) return null;
              return (
                <div
                  key={customer.id}
                  className="bg-white rounded-xl border border-border shadow-card overflow-hidden"
                >
                  <div
                    className="px-5 py-3 border-b border-border flex items-center justify-between"
                    style={{ background: "#f8fafc" }}
                  >
                    <div>
                      <p className="font-semibold">{customer.companyName}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.storeNumber} | {customer.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-bold"
                        style={{
                          color:
                            result.closingBalance > 0 ? "#dc2626" : "#16a34a",
                        }}
                      >
                        {formatCurrency(Math.abs(result.closingBalance))}{" "}
                        {result.closingBalance > 0 ? "Dr" : "Cr"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Closing Balance
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead style={{ background: "#1e293b", color: "white" }}>
                        <tr>
                          <th className="text-left px-4 py-2">Date</th>
                          <th className="text-left px-4 py-2">Description</th>
                          <th className="text-right px-4 py-2">Debit</th>
                          <th className="text-right px-4 py-2">Credit</th>
                          <th className="text-right px-4 py-2">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.entries.map((e) => (
                          <tr
                            key={`${e.date}-${e.description}`}
                            className="border-t border-border"
                          >
                            <td className="px-4 py-1.5 text-muted-foreground">
                              {e.date}
                            </td>
                            <td className="px-4 py-1.5">{e.description}</td>
                            <td className="px-4 py-1.5 text-right text-red-600">
                              {e.debit > 0 ? formatCurrency(e.debit) : "-"}
                            </td>
                            <td className="px-4 py-1.5 text-right text-green-600">
                              {e.credit > 0 ? formatCurrency(e.credit) : "-"}
                            </td>
                            <td className="px-4 py-1.5 text-right font-bold">
                              {formatCurrency(Math.abs(e.balance))}{" "}
                              {e.balance > 0 ? "Dr" : "Cr"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Payment Feed */}
        <TabsContent value="payment_feed" className="space-y-4">
          <div className="bg-white rounded-xl border border-border shadow-card p-5">
            <h3 className="font-semibold font-display mb-4 flex items-center gap-2">
              <CreditCard size={17} /> Record Payment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Customer</Label>
                <CustomerCombobox
                  value={payCustomer}
                  onValueChange={setPayCustomer}
                  customers={customers}
                  placeholder="Search customer..."
                  ocid="accounts.payment.customer_select"
                />
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    data-ocid="accounts.payment.amount_input"
                    type="number"
                    placeholder="0"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="col-span-full sm:col-span-2">
                <Label className="mb-2 block">Payment Method</Label>
                <RadioGroup
                  data-ocid="accounts.payment.method.radio"
                  value={payMethod}
                  onValueChange={(v) => {
                    setPayMethod(v as PaymentMethod);
                    setPayRef("");
                  }}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={PaymentMethod.cash} id="pm-cash" />
                    <Label htmlFor="pm-cash">Cash</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value={PaymentMethod.online}
                      id="pm-online"
                    />
                    <Label htmlFor="pm-online">Online (UPI/NEFT)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value={PaymentMethod.cheque}
                      id="pm-cheque"
                    />
                    <Label htmlFor="pm-cheque">Cheque</Label>
                  </div>
                </RadioGroup>
              </div>
              {payMethod !== PaymentMethod.cash && (
                <div className="col-span-full sm:col-span-2">
                  <Label>
                    {payMethod === PaymentMethod.online
                      ? "UTR Number"
                      : "Cheque Number"}
                  </Label>
                  <Input
                    data-ocid="accounts.payment.reference_input"
                    placeholder={
                      payMethod === PaymentMethod.online
                        ? "Enter UTR number"
                        : "Enter cheque number"
                    }
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            <Button
              data-ocid="accounts.payment.submit_button"
              className="mt-4"
              onClick={handleRecordPayment}
              disabled={payLoading}
            >
              {payLoading ? "Recording..." : "Record Payment"}
            </Button>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold font-display">Recent Payments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                      Customer
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                      Method
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(p.recordedAt)}
                      </td>
                      <td className="px-4 py-3 font-medium">{p.companyName}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background:
                              p.paymentMethod === PaymentMethod.cash
                                ? "#dcfce7"
                                : p.paymentMethod === PaymentMethod.online
                                  ? "#dbeafe"
                                  : "#fef3c7",
                            color:
                              p.paymentMethod === PaymentMethod.cash
                                ? "#16a34a"
                                : p.paymentMethod === PaymentMethod.online
                                  ? "#2563eb"
                                  : "#d97706",
                          }}
                        >
                          {p.paymentMethod.charAt(0).toUpperCase() +
                            p.paymentMethod.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">
                        {p.referenceNumber || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
