import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CheckCheck,
  Download,
  Edit2,
  Grid3X3,
  List,
  Package,
  Plus,
  Search,
  Upload,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../../backend.d";
import { useDataStore } from "../../dataStore";
import { formatCurrency } from "../../mockData";

const blankProduct = (): Omit<Product, "id" | "createdAt"> => ({
  name: "",
  unit: "Kgs",
  rate: 0,
  isActive: true,
});

function generateCSV(products: Product[]) {
  const header = "Name,Unit,Rate,Status";
  const rows = products.map(
    (p) =>
      `${p.name},${p.unit},${p.rate},${p.isActive ? "Active" : "Inactive"}`,
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

export default function Products() {
  const { products, addProduct, updateProduct, toggleProduct, setProducts } =
    useDataStore();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id" | "createdAt">>(
    blankProduct(),
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, unit: p.unit, rate: p.rate, isActive: p.isActive });
    setImagePreview(null);
    setAddOpen(true);
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm(blankProduct());
    setImagePreview(null);
    setAddOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.rate || form.rate <= 0) {
      toast.error("Please enter a valid rate");
      return;
    }
    if (editProduct) {
      updateProduct(editProduct.id, { ...editProduct, ...form });
      toast.success("Product updated!");
    } else {
      const np: Product = {
        id: `p${Date.now()}`,
        createdAt: BigInt(Date.now()),
        ...form,
      };
      addProduct(np);
      toast.success("Product added!");
    }
    setAddOpen(false);
  };

  const toggleStatus = (id: string) => {
    toggleProduct(id);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  return (
    <div data-ocid="products.section" className="p-4 lg:p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            data-ocid="products.search_input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            data-ocid="products.add.open_modal_button"
            size="sm"
            onClick={openAdd}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus size={15} className="mr-1" /> Add Product
          </Button>
          <Button
            data-ocid="products.bulk_upload.open_modal_button"
            size="sm"
            variant="outline"
            onClick={() => setBulkUploadOpen(true)}
          >
            <Upload size={15} className="mr-1" /> Bulk Upload
          </Button>
          <Button
            data-ocid="products.download.button"
            size="sm"
            variant="outline"
            onClick={() => {
              downloadCSV(generateCSV(products), "products.csv");
              toast.success("Downloaded!");
            }}
          >
            <Download size={15} className="mr-1" /> Download All
          </Button>
          <Button
            data-ocid="products.template.button"
            size="sm"
            variant="outline"
            onClick={() => {
              downloadCSV("Name,Unit,Rate,Status", "product_template.csv");
              toast.success("Template downloaded!");
            }}
          >
            <Download size={15} className="mr-1" /> Template
          </Button>
        </div>
      </div>

      {/* Bulk actions + view toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          data-ocid="products.activate_all.button"
          size="sm"
          variant="outline"
          onClick={() => {
            setProducts(products.map((p) => ({ ...p, isActive: true })));
            toast.success("All products activated");
          }}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <CheckCheck size={14} className="mr-1" /> Activate All
        </Button>
        <Button
          data-ocid="products.deactivate_all.button"
          size="sm"
          variant="outline"
          onClick={() => {
            setProducts(products.map((p) => ({ ...p, isActive: false })));
            toast.success("All products deactivated");
          }}
          className="text-red-500 border-red-200 hover:bg-red-50"
        >
          <XCircle size={14} className="mr-1" /> Deactivate All
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} products
        </span>
        <button
          type="button"
          onClick={() => setViewMode("grid")}
          className={`p-1.5 rounded ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
        >
          <Grid3X3 size={16} />
        </button>
        <button
          type="button"
          onClick={() => setViewMode("list")}
          className={`p-1.5 rounded ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
        >
          <List size={16} />
        </button>
      </div>

      {/* Product List */}
      {viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">
                    Unit
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    Rate
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                    Edit
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, i) => (
                  <tr
                    key={product.id}
                    data-ocid={i < 3 ? `products.item.${i + 1}` : undefined}
                    className="border-t border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "#f1f5f9" }}
                        >
                          <Package
                            size={14}
                            className="text-muted-foreground"
                          />
                        </div>
                        <span className="font-medium truncate max-w-[180px]">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {product.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      {formatCurrency(product.rate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={product.isActive}
                        onCheckedChange={() => toggleStatus(product.id)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(product)}
                        className="h-7 px-2"
                      >
                        <Edit2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((product, i) => (
            <div
              key={product.id}
              data-ocid={i < 3 ? `products.item.${i + 1}` : undefined}
              className="bg-white rounded-xl border border-border shadow-card p-3 flex flex-col gap-2"
            >
              <div
                className="w-full h-20 rounded-lg flex items-center justify-center"
                style={{ background: "#f1f5f9" }}
              >
                <Package size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.unit}</p>
              <p className="text-sm font-bold text-primary">
                {formatCurrency(product.rate)}
              </p>
              <div className="flex items-center justify-between">
                <Badge
                  variant={product.isActive ? "default" : "secondary"}
                  className={
                    product.isActive
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : ""
                  }
                >
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEdit(product)}
                  className="h-6 px-1.5"
                >
                  <Edit2 size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="prod-name">Product Name *</Label>
              <Input
                id="prod-name"
                data-ocid="products.add.name_input"
                placeholder="Enter product name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Unit</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
              >
                <SelectTrigger
                  data-ocid="products.add.unit_select"
                  className="mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kgs">Kgs</SelectItem>
                  <SelectItem value="Each">Each</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prod-rate">Rate (₹)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  ₹
                </span>
                <Input
                  id="prod-rate"
                  data-ocid="products.add.rate_input"
                  type="number"
                  placeholder="0"
                  value={form.rate || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rate: Number(e.target.value) }))
                  }
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                data-ocid="products.add.status_toggle"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                className="data-[state=checked]:bg-green-500"
              />
              <Label>{form.isActive ? "Active" : "Inactive"}</Label>
            </div>
            <div>
              <Label>Product Image</Label>
              <div className="mt-1 flex items-center gap-3">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-16 h-16 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center border border-dashed border-border">
                    <Package size={20} className="text-muted-foreground" />
                  </div>
                )}
                <Button
                  data-ocid="products.add.image.upload_button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} className="mr-1" /> Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button data-ocid="products.add.submit_button" onClick={handleSave}>
              {editProduct ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Upload Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div
              className="p-4 rounded-lg text-sm space-y-2"
              style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}
            >
              <p className="font-semibold text-blue-800">
                CSV Format Instructions:
              </p>
              <p className="text-blue-700">
                Column headers: Name, Unit, Rate, Status
              </p>
              <p className="text-blue-700">Unit values: Kgs or Each</p>
              <p className="text-blue-700">Status values: Active or Inactive</p>
            </div>
            <div
              data-ocid="products.bulk_upload.dropzone"
              className="border-2 border-dashed border-border rounded-xl p-8 text-center"
            >
              <Upload
                size={32}
                className="mx-auto text-muted-foreground mb-2"
              />
              <p className="text-sm font-medium">Click to upload CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">
                Existing products will NOT be changed
              </p>
              <label className="cursor-pointer mt-3 inline-block text-xs text-primary underline">
                Choose file
                <input
                  id="bulk-file"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={() => {
                    toast.success("File selected! Processing...");
                    setBulkUploadOpen(false);
                  }}
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setBulkUploadOpen(false)}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
