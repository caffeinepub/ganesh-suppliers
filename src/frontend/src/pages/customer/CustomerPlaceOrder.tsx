import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CheckCircle,
  Heart,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Customer, Order } from "../../backend.d";
import { OrderStatus } from "../../backend.d";
import {
  addCustomerOrder,
  getAllOrdersWithCustomer,
} from "../../customerOrderStore";
import {
  formatCurrency,
  mockCompanyProfile,
  mockOrders,
  mockProducts,
} from "../../mockData";

type PlaceOrderView =
  | "browse"
  | "favorites"
  | "cart"
  | "upi-payment"
  | "pay-later-confirm"
  | "order-success";

interface CartItem {
  productId: string;
  productName: string;
  unit: string;
  rate: number;
  quantity: number;
}

interface Props {
  customer: Customer;
  onOrderPlaced: () => void;
}

export default function CustomerPlaceOrder({ customer, onOrderPlaced }: Props) {
  const [view, setView] = useState<PlaceOrderView>("browse");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`favorites_${customer.id}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [upiRef, setUpiRef] = useState("");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const activeProducts = mockProducts.filter((p) => p.isActive);
  const filteredProducts = activeProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const favoriteProducts = activeProducts.filter((p) => favorites.has(p.id));

  const cartTotal = cart.reduce((s, i) => s + i.rate * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const saveFavorites = (newFavs: Set<string>) => {
    setFavorites(newFavs);
    localStorage.setItem(
      `favorites_${customer.id}`,
      JSON.stringify([...newFavs]),
    );
  };

  const toggleFavorite = (productId: string) => {
    const next = new Set(favorites);
    if (next.has(productId)) next.delete(productId);
    else next.add(productId);
    saveFavorites(next);
  };

  const addToCart = (productId: string) => {
    const qty = quantities[productId] || 0;
    if (qty <= 0) return;
    const product = activeProducts.find((p) => p.id === productId);
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [
        ...prev,
        {
          productId,
          productName: product.name,
          unit: product.unit,
          rate: product.rate,
          quantity: qty,
        },
      ];
    });
    setQuantities((prev) => ({ ...prev, [productId]: 0 }));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: qty } : i,
      ),
    );
  };

  const createOrder = (paymentMethod: string, paymentRef = ""): Order => {
    const allOrders = getAllOrdersWithCustomer();
    const invoiceNumber = `GS/${new Date().getFullYear()}/${String(allOrders.length + 1).padStart(3, "0")}`;
    return {
      id: `order_${Date.now()}`,
      invoiceNumber,
      customerId: customer.id,
      companyName: customer.companyName,
      storeNumber: customer.storeNumber,
      address: customer.address,
      items: cart.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        unit: i.unit,
        rate: i.rate,
        quantity: i.quantity,
        amount: i.rate * i.quantity,
      })),
      totalAmount: cartTotal,
      status: OrderStatus.pending,
      createdAt: BigInt(Date.now()),
      // Store payment info in a note field; we add extra fields for display
      ...(paymentMethod === "upi_advance"
        ? { paymentMethod: "upi_advance", paymentReference: paymentRef }
        : { paymentMethod: "pay_later" }),
    } as Order;
  };

  const confirmUpiPayment = () => {
    if (!upiRef.trim()) return;
    const order = createOrder("upi_advance", upiRef.trim());
    addCustomerOrder(order);
    setPlacedOrder(order);
    setCart([]);
    setView("order-success");
  };

  const confirmPayLater = () => {
    const order = createOrder("pay_later");
    addCustomerOrder(order);
    setPlacedOrder(order);
    setCart([]);
    setView("order-success");
  };

  const ProductCard = ({ productId }: { productId: string }) => {
    const product = activeProducts.find((p) => p.id === productId);
    if (!product) return null;
    const isFav = favorites.has(product.id);
    const qty = quantities[product.id] || 0;
    return (
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p
              className="font-semibold text-sm truncate"
              style={{ color: "#1e293b" }}
            >
              {product.name}
            </p>
            <p className="text-xs text-muted-foreground">{product.unit}</p>
          </div>
          <button
            type="button"
            data-ocid="order.favorite.toggle"
            onClick={() => toggleFavorite(product.id)}
            className="ml-2 flex-shrink-0 p-1 rounded-lg transition-colors"
            style={{ color: isFav ? "#ef4444" : "#cbd5e1" }}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={16} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>
        <p
          className="text-lg font-bold"
          style={{
            color: "#f97316",
            fontFamily: "Bricolage Grotesque, sans-serif",
          }}
        >
          {formatCurrency(product.rate)}
          <span className="text-xs font-normal text-muted-foreground">
            {" "}
            /{product.unit}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step="1"
            placeholder="Qty"
            value={qty || ""}
            onChange={(e) =>
              setQuantities((prev) => ({
                ...prev,
                [product.id]: Number(e.target.value),
              }))
            }
            className="h-8 text-sm"
            style={{ flex: 1 }}
          />
          <Button
            size="sm"
            disabled={!qty || qty <= 0}
            onClick={() => addToCart(product.id)}
            data-ocid="order.add-to-cart.button"
            className="h-8 text-xs"
            style={
              qty > 0
                ? { background: "#f97316", color: "#fff", border: "none" }
                : {}
            }
          >
            Add
          </Button>
        </div>
      </div>
    );
  };

  if (view === "order-success" && placedOrder) {
    const pm = (placedOrder as any).paymentMethod;
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <div
          className="rounded-2xl p-8"
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}
        >
          <CheckCircle
            size={56}
            className="mx-auto mb-4"
            style={{ color: "#10b981" }}
          />
          <h2
            className="text-2xl font-bold mb-2"
            style={{
              fontFamily: "Bricolage Grotesque, sans-serif",
              color: "#1e293b",
            }}
          >
            Order Placed!
          </h2>
          <p className="text-muted-foreground mb-4">
            Your order has been submitted to Ganesh Suppliers.
          </p>
          <div
            className="rounded-xl p-4 mb-4 text-left"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Invoice #</span>
              <span
                className="font-semibold text-sm"
                style={{ color: "#1e293b" }}
              >
                {placedOrder.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Total Amount
              </span>
              <span
                className="font-semibold text-sm"
                style={{ color: "#1e293b" }}
              >
                {formatCurrency(placedOrder.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payment</span>
              <Badge
                style={{
                  background: pm === "upi_advance" ? "#dbeafe" : "#fef9c3",
                  color: pm === "upi_advance" ? "#1e40af" : "#854d0e",
                  border: "none",
                }}
              >
                {pm === "upi_advance" ? "UPI Advance" : "Pay Later"}
              </Badge>
            </div>
            {pm === "upi_advance" && (placedOrder as any).paymentReference && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Reference</span>
                <span
                  className="font-medium text-xs"
                  style={{ color: "#1e293b" }}
                >
                  {(placedOrder as any).paymentReference}
                </span>
              </div>
            )}
          </div>
          <Button
            data-ocid="order.go-to-dashboard.button"
            onClick={onOrderPlaced}
            className="w-full"
            style={{ background: "#f97316", color: "#fff", border: "none" }}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (view === "upi-payment") {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <button
          type="button"
          data-ocid="order.back.button"
          onClick={() => setView("cart")}
          className="flex items-center gap-2 mb-6 text-sm text-muted-foreground"
        >
          <ArrowLeft size={16} /> Back to Cart
        </button>
        <div
          className="rounded-2xl p-6"
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            className="text-xl font-bold mb-1"
            style={{
              fontFamily: "Bricolage Grotesque, sans-serif",
              color: "#1e293b",
            }}
          >
            Pay via UPI
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Scan the QR code or use UPI ID to pay
          </p>

          {/* Amount */}
          <div
            className="rounded-xl p-4 mb-6 text-center"
            style={{
              background: "rgba(249,115,22,0.07)",
              border: "1px solid rgba(249,115,22,0.2)",
            }}
          >
            <p className="text-sm text-muted-foreground">Amount to Pay</p>
            <p
              className="text-3xl font-bold mt-1"
              style={{
                color: "#f97316",
                fontFamily: "Bricolage Grotesque, sans-serif",
              }}
            >
              {formatCurrency(cartTotal)}
            </p>
          </div>

          {/* QR Placeholder */}
          <div
            className="rounded-xl p-6 mb-4 flex flex-col items-center gap-3"
            style={{ background: "#f8fafc", border: "2px dashed #e2e8f0" }}
          >
            <div
              className="w-32 h-32 rounded-lg flex items-center justify-center"
              style={{ background: "#1e293b" }}
            >
              <div className="text-center">
                <p className="text-white text-xs font-bold">SCAN TO PAY</p>
                <p className="text-orange-400 text-xs mt-1">QR Code</p>
              </div>
            </div>
            <p className="text-sm font-medium" style={{ color: "#1e293b" }}>
              UPI ID: {mockCompanyProfile.upiId}
            </p>
          </div>

          {/* Open Payment App */}
          <Button
            data-ocid="order.open-payment-app.button"
            className="w-full mb-4"
            style={{ background: "#1e293b", color: "#fff", border: "none" }}
            onClick={() =>
              window.open(
                `upi://pay?pa=${mockCompanyProfile.upiId}&am=${cartTotal}&cu=INR`,
                "_blank",
              )
            }
          >
            📱 Open Payment App (GPay / PhonePe / Paytm)
          </Button>

          {/* Reference Input */}
          <div className="mb-4">
            <label
              htmlFor="upi-ref"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "#1e293b" }}
            >
              Payment Reference ID / UTR Number
            </label>
            <Input
              id="upi-ref"
              data-ocid="order.upi-ref.input"
              placeholder="Enter UTR / transaction reference"
              value={upiRef}
              onChange={(e) => setUpiRef(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the reference ID from your payment app after completing
              payment.
            </p>
          </div>

          <Button
            data-ocid="order.confirm-upi.button"
            className="w-full"
            disabled={!upiRef.trim()}
            onClick={confirmUpiPayment}
            style={{
              background: upiRef.trim() ? "#10b981" : undefined,
              color: upiRef.trim() ? "#fff" : undefined,
              border: "none",
            }}
          >
            ✓ Confirm Payment & Place Order
          </Button>
        </div>
      </div>
    );
  }

  if (view === "pay-later-confirm") {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <button
          type="button"
          data-ocid="order.back.button"
          onClick={() => setView("cart")}
          className="flex items-center gap-2 mb-6 text-sm text-muted-foreground"
        >
          <ArrowLeft size={16} /> Back to Cart
        </button>
        <div
          className="rounded-2xl p-6"
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            className="text-xl font-bold mb-1"
            style={{
              fontFamily: "Bricolage Grotesque, sans-serif",
              color: "#1e293b",
            }}
          >
            Confirm Order — Pay Later
          </h2>
          <p className="text-muted-foreground text-sm mb-5">
            Your order will be placed with a pay-later invoice.
          </p>
          <div
            className="rounded-xl overflow-hidden mb-5"
            style={{ border: "1px solid #e2e8f0" }}
          >
            <table className="w-full text-sm">
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">
                    Item
                  </th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">
                    Qty
                  </th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr
                    key={item.productId}
                    style={{ borderTop: "1px solid #f1f5f9" }}
                  >
                    <td className="px-4 py-2.5" style={{ color: "#1e293b" }}>
                      {item.productName}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({item.unit})
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {item.quantity}
                    </td>
                    <td
                      className="px-4 py-2.5 text-right font-medium"
                      style={{ color: "#1e293b" }}
                    >
                      {formatCurrency(item.rate * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot
                style={{
                  borderTop: "2px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                <tr>
                  <td
                    className="px-4 py-3 font-bold"
                    style={{ color: "#1e293b" }}
                    colSpan={2}
                  >
                    Total
                  </td>
                  <td
                    className="px-4 py-3 text-right font-bold text-lg"
                    style={{ color: "#f97316" }}
                  >
                    {formatCurrency(cartTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <Button
            data-ocid="order.confirm-pay-later.button"
            className="w-full"
            onClick={confirmPayLater}
            style={{ background: "#f97316", color: "#fff", border: "none" }}
          >
            ✓ Confirm Order (Pay Later)
          </Button>
        </div>
      </div>
    );
  }

  if (view === "cart") {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button
          type="button"
          data-ocid="order.back.button"
          onClick={() => setView("browse")}
          className="flex items-center gap-2 mb-6 text-sm text-muted-foreground"
        >
          <ArrowLeft size={16} /> Continue Shopping
        </button>
        <h2
          className="text-xl font-bold mb-5"
          style={{
            fontFamily: "Bricolage Grotesque, sans-serif",
            color: "#1e293b",
          }}
        >
          Your Cart
        </h2>
        {cart.length === 0 ? (
          <div
            data-ocid="cart.empty_state"
            className="text-center py-16 rounded-2xl"
            style={{ background: "#fff", border: "1px solid #e2e8f0" }}
          >
            <ShoppingCart
              size={40}
              className="mx-auto mb-3"
              style={{ color: "#cbd5e1" }}
            />
            <p className="text-muted-foreground">Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div
              className="rounded-xl overflow-hidden mb-5"
              style={{ background: "#fff", border: "1px solid #e2e8f0" }}
            >
              <table className="w-full text-sm">
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Product
                    </th>
                    <th className="text-center px-4 py-3 text-muted-foreground font-medium">
                      Qty
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                      Rate
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                      Amount
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr
                      key={item.productId}
                      data-ocid={`cart.item.${idx + 1}`}
                      style={{ borderTop: "1px solid #f1f5f9" }}
                    >
                      <td className="px-4 py-3" style={{ color: "#1e293b" }}>
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({item.unit})
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateCartQty(
                              item.productId,
                              Number(e.target.value),
                            )
                          }
                          className="w-16 text-center border rounded-lg p-1 text-sm"
                          style={{ borderColor: "#e2e8f0" }}
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatCurrency(item.rate)}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-semibold"
                        style={{ color: "#1e293b" }}
                      >
                        {formatCurrency(item.rate * item.quantity)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          data-ocid={`cart.delete_button.${idx + 1}`}
                          onClick={() => removeFromCart(item.productId)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          style={{ color: "#ef4444" }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot
                  style={{
                    borderTop: "2px solid #e2e8f0",
                    background: "#f8fafc",
                  }}
                >
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 font-bold text-right"
                      style={{ color: "#1e293b" }}
                    >
                      Total
                    </td>
                    <td
                      className="px-4 py-3 text-right font-bold text-lg"
                      style={{ color: "#f97316" }}
                    >
                      {formatCurrency(cartTotal)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                data-ocid="order.upi-payment.button"
                className="flex-1"
                onClick={() => setView("upi-payment")}
                style={{ background: "#1e293b", color: "#fff", border: "none" }}
              >
                📱 Pay via UPI (Advance)
              </Button>
              <Button
                data-ocid="order.pay-later.button"
                className="flex-1"
                onClick={() => setView("pay-later-confirm")}
                style={{ background: "#f97316", color: "#fff", border: "none" }}
              >
                🧾 Pay Later
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Browse / Favorites view
  const displayProducts =
    view === "favorites" ? favoriteProducts : filteredProducts;

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <button
            type="button"
            data-ocid="order.browse.tab"
            onClick={() => setView("browse")}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: view === "browse" ? "#f97316" : "#fff",
              color: view === "browse" ? "#fff" : "#64748b",
            }}
          >
            All Products
          </button>
          <button
            type="button"
            data-ocid="order.favorites.tab"
            onClick={() => setView("favorites")}
            className="px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5"
            style={{
              background: view === "favorites" ? "#ef4444" : "#fff",
              color: view === "favorites" ? "#fff" : "#64748b",
            }}
          >
            <Heart
              size={14}
              fill={view === "favorites" ? "currentColor" : "none"}
            />
            Favorites
            {favorites.size > 0 && (
              <span
                className="ml-1 px-1.5 rounded-full text-xs"
                style={{
                  background:
                    view === "favorites" ? "rgba(255,255,255,0.3)" : "#ef4444",
                  color: "#fff",
                }}
              >
                {favorites.size}
              </span>
            )}
          </button>
        </div>
        {view === "browse" && (
          <div className="relative flex-1 min-w-48">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              data-ocid="order.search.input"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        )}
        <button
          type="button"
          data-ocid="order.cart.button"
          onClick={() => setView("cart")}
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: "#1e293b", color: "#fff" }}
        >
          <ShoppingCart size={16} />
          Cart
          {cartCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "#f97316", color: "#fff" }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Products grid */}
      {displayProducts.length === 0 ? (
        <div
          data-ocid="order.products.empty_state"
          className="text-center py-16"
        >
          <p className="text-muted-foreground">
            {view === "favorites"
              ? "No favorites yet. Click the ♥ on any product to add."
              : "No products found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {displayProducts.map((p) => (
            <ProductCard key={p.id} productId={p.id} />
          ))}
        </div>
      )}
    </div>
  );
}
