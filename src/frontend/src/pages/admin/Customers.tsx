import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Switch } from "@/components/ui/switch";
import {
  Download,
  Edit2,
  Plus,
  Search,
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Customer } from "../../backend.d";
import { useDataStore } from "../../dataStore";
import { formatDate } from "../../mockData";

const blankCustomer = (): Partial<Customer> => ({
  storeNumber: "",
  customerName: "",
  phone: "",
  companyName: "",
  address: "",
  gstNumber: "",
  email: "",
  passwordHash: "",
  isActive: true,
});

function generateCSV(customers: Customer[]) {
  const header =
    "StoreNumber,CustomerName,Phone,CompanyName,Address,GSTNumber,Email,Status";
  const rows = customers.map(
    (c) =>
      `${c.storeNumber},${c.customerName},${c.phone},${c.companyName},"${c.address}",${c.gstNumber},${c.email},${c.isActive ? "Active" : "Inactive"}`,
  );
  return [header, ...rows].join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Customers() {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    toggleCustomer,
  } = useDataStore();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<Customer>>(blankCustomer());

  const filtered = customers.filter(
    (c) =>
      c.storeNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.companyName.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditCustomer(null);
    setForm(blankCustomer());
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setForm({ ...c });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.storeNumber?.trim()) {
      toast.error("Store Number is mandatory");
      return;
    }
    if (editCustomer) {
      updateCustomer(editCustomer.storeNumber, {
        ...editCustomer,
        ...form,
      } as Customer);
      toast.success("Customer updated!");
    } else {
      if (
        customers.some(
          (c) =>
            c.storeNumber.toUpperCase() ===
            (form.storeNumber || "").trim().toUpperCase(),
        )
      ) {
        toast.error("Store Number already exists");
        return;
      }
      const nc: Customer = {
        id: `c${Date.now()}`,
        createdAt: BigInt(Date.now()),
        isActive: true,
        ...form,
        // Normalize store number to uppercase for consistent login matching
        storeNumber: (form.storeNumber || "").trim().toUpperCase(),
        userId: form.userId ?? undefined,
      } as Customer;
      addCustomer(nc);
      toast.success("Customer added!");
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCustomer(deleteTarget.storeNumber);
    toast.success("Customer deleted");
    setDeleteTarget(null);
  };

  const toggleStatus = (storeNumber: string) => {
    toggleCustomer(storeNumber);
  };

  return (
    <div data-ocid="customers.section" className="p-4 lg:p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            data-ocid="customers.add.open_modal_button"
            size="sm"
            onClick={openAdd}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus size={14} className="mr-1" /> Add Customer
          </Button>
          <Button
            data-ocid="customers.upload.button"
            size="sm"
            variant="outline"
          >
            <Upload size={14} className="mr-1" /> Upload CSV
          </Button>
          <Button
            data-ocid="customers.download_template.button"
            size="sm"
            variant="outline"
            onClick={() => {
              downloadCSV(
                "StoreNumber,CustomerName,Phone,CompanyName,Address,GSTNumber,Email,Password",
                "customer_template.csv",
              );
              toast.success("Template downloaded");
            }}
          >
            <Download size={14} className="mr-1" /> Template
          </Button>
          <Button
            data-ocid="customers.download_all.button"
            size="sm"
            variant="outline"
            onClick={() => {
              downloadCSV(generateCSV(customers), "customers.csv");
              toast.success("Downloaded");
            }}
          >
            <Download size={14} className="mr-1" /> Download All
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} customers
      </p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Store #
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Company
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Phone
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  GST
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Joined
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  data-ocid={i < 3 ? `customers.item.${i + 1}` : undefined}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                    {c.storeNumber}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "#f97316" }}
                      >
                        {c.customerName.charAt(0)}
                      </div>
                      {c.customerName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.companyName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {c.gstNumber || "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      data-ocid={
                        i === 0 ? "customers.status.toggle.1" : undefined
                      }
                      checked={c.isActive}
                      onCheckedChange={() => toggleStatus(c.storeNumber)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        data-ocid={
                          i === 0
                            ? "customers.edit.open_modal_button.1"
                            : undefined
                        }
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(c)}
                        className="h-7 px-2"
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        data-ocid={
                          i === 0 ? "customers.delete.button.1" : undefined
                        }
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(c)}
                        className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck size={18} />
              {editCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
            <DialogDescription>
              {editCustomer
                ? "Update customer details below."
                : "Fill in the details to add a new customer."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label htmlFor="store-no">Store Number *</Label>
              <Input
                id="store-no"
                data-ocid="customers.add.store_input"
                placeholder="e.g. STR023"
                value={form.storeNumber || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, storeNumber: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cust-name">Customer Name</Label>
              <Input
                id="cust-name"
                placeholder="Full name"
                value={form.customerName || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerName: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cust-phone">Phone</Label>
              <Input
                id="cust-phone"
                placeholder="10-digit number"
                value={form.phone || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="cust-company">Company Name</Label>
              <Input
                id="cust-company"
                placeholder="Business name"
                value={form.companyName || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, companyName: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="cust-addr">Address</Label>
              <Input
                id="cust-addr"
                placeholder="Full address"
                value={form.address || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cust-gst">GST Number</Label>
              <Input
                id="cust-gst"
                placeholder="GST number"
                value={form.gstNumber || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gstNumber: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                placeholder="email@example.com"
                value={form.email || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="cust-pass">Password</Label>
              <Input
                id="cust-pass"
                type="password"
                placeholder="Set password"
                value={form.passwordHash || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, passwordHash: e.target.value }))
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              data-ocid="customers.add.submit_button"
              onClick={handleSave}
            >
              {editCustomer ? "Save Changes" : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.customerName}</strong> (
              {deleteTarget?.storeNumber})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="customers.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="customers.delete.confirm_button"
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
