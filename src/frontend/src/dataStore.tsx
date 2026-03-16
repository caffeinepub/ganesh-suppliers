/**
 * Global Data Store backed by ICP backend canister.
 * All data reads and writes go through this store and are shared across devices.
 *
 * IMPORTANT: No demo/seed data is ever loaded automatically.
 * The backend is the single source of truth. If it's empty, the app starts empty.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type {
  CompanyProfile,
  Customer,
  Order,
  Payment,
  Product,
} from "./backend.d";
import { createActorWithConfig } from "./config";
import {
  DEFAULT_ADMIN_PASSWORD,
  LEGACY_ADMIN_PASSWORD,
  mockCompanyProfile,
} from "./mockData";

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------
interface DataStoreContextType {
  // Customers
  customers: Customer[];
  addCustomer: (c: Customer) => void;
  updateCustomer: (storeNumber: string, c: Customer) => void;
  deleteCustomer: (storeNumber: string) => void;
  toggleCustomer: (storeNumber: string) => void;
  setCustomers: (cs: Customer[]) => void;

  // Products
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Product) => void;
  deleteProduct: (id: string) => void;
  toggleProduct: (id: string) => void;
  setProducts: (ps: Product[]) => void;

  // Orders
  orders: Order[];
  addOrder: (o: Order) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  deleteOrder: (id: string, reason: string) => void;
  setOrders: (os: Order[]) => void;

  // Payments
  payments: Payment[];
  addPayment: (p: Payment) => void;
  setPayments: (ps: Payment[]) => void;

  // Company Profile
  profile: CompanyProfile;
  updateProfile: (p: CompanyProfile) => void;

  // Clear all data (admin use)
  clearAllData: () => Promise<void>;

  // Refresh
  refreshData: () => Promise<void>;
}

const DataStoreContext = createContext<DataStoreContextType | null>(null);

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomersState] = useState<Customer[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [payments, setPaymentsState] = useState<Payment[]>([]);
  const [profile, setProfileState] = useState<CompanyProfile>({
    ...mockCompanyProfile,
  });

  const fetchAll = useCallback(async () => {
    try {
      const actor = await createActorWithConfig();
      const [
        fetchedCustomers,
        fetchedProducts,
        fetchedOrders,
        fetchedPayments,
        fetchedProfile,
      ] = await Promise.all([
        (actor as any).getCustomers(),
        (actor as any).getAllProducts(),
        (actor as any).getAllOrders(),
        (actor as any).getAllPayments(),
        (actor as any).getCompanyProfile(),
      ]);

      setCustomersState(fetchedCustomers);
      setProductsState(fetchedProducts);
      setOrdersState(fetchedOrders as Order[]);
      setPaymentsState(fetchedPayments);

      if (fetchedProfile) {
        // Migrate legacy password: if stored password is old default, update to Admin@1234
        if (fetchedProfile.adminPasswordHash === LEGACY_ADMIN_PASSWORD) {
          const migratedProfile = {
            ...fetchedProfile,
            adminPasswordHash: DEFAULT_ADMIN_PASSWORD,
          };
          setProfileState(migratedProfile);
          try {
            await (actor as any).updateCompanyProfile(migratedProfile);
          } catch (migrateErr) {
            console.error("Password migration failed", migrateErr);
            setProfileState(fetchedProfile);
          }
        } else {
          setProfileState(fetchedProfile);
        }
      }
    } catch (err) {
      console.error("Failed to load data from backend", err);
      toast.error("Failed to load data from server. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await fetchAll();
  }, [fetchAll]);

  // --- Clear All Data ---
  const clearAllData = useCallback(async () => {
    try {
      const actor = await createActorWithConfig();
      await (actor as any).clearAllData();
      setCustomersState([]);
      setProductsState([]);
      setOrdersState([]);
      setPaymentsState([]);
      // Refresh profile from backend after clear
      const freshProfile = await (actor as any).getCompanyProfile();
      if (freshProfile) setProfileState(freshProfile);
    } catch (err) {
      console.error("clearAllData failed", err);
      toast.error("Failed to reset data.");
      throw err;
    }
  }, []);

  // --- Customers ---
  const setCustomers = useCallback(async (cs: Customer[]) => {
    setCustomersState(cs);
    try {
      const actor = await createActorWithConfig();
      await (actor as any).bulkImportCustomers(cs);
    } catch (err) {
      console.error("bulkImportCustomers failed", err);
      toast.error("Failed to save customers to server.");
    }
  }, []);

  const addCustomer = useCallback(async (c: Customer) => {
    setCustomersState((prev) => [...prev, c]);
    try {
      const actor = await createActorWithConfig();
      await (actor as any).addCustomer(c);
    } catch (err) {
      console.error("addCustomer failed", err);
      toast.error("Failed to save customer.");
      setCustomersState((prev) => prev.filter((x) => x.id !== c.id));
    }
  }, []);

  const updateCustomer = useCallback(
    async (storeNumber: string, c: Customer) => {
      setCustomersState((prev) =>
        prev.map((x) => (x.storeNumber === storeNumber ? c : x)),
      );
      try {
        const actor = await createActorWithConfig();
        await (actor as any).editCustomer(storeNumber, c);
      } catch (err) {
        console.error("editCustomer failed", err);
        toast.error("Failed to update customer.");
      }
    },
    [],
  );

  const deleteCustomer = useCallback(
    async (storeNumber: string) => {
      const prev = customers;
      setCustomersState((p) => p.filter((x) => x.storeNumber !== storeNumber));
      try {
        const actor = await createActorWithConfig();
        await (actor as any).deleteCustomer(storeNumber);
      } catch (err) {
        console.error("deleteCustomer failed", err);
        toast.error("Failed to delete customer.");
        setCustomersState(prev);
      }
    },
    [customers],
  );

  const toggleCustomer = useCallback(async (storeNumber: string) => {
    setCustomersState((prev) =>
      prev.map((x) =>
        x.storeNumber === storeNumber ? { ...x, isActive: !x.isActive } : x,
      ),
    );
    try {
      const actor = await createActorWithConfig();
      await (actor as any).toggleCustomerState(storeNumber);
    } catch (err) {
      console.error("toggleCustomer failed", err);
      toast.error("Failed to toggle customer.");
      setCustomersState((prev) =>
        prev.map((x) =>
          x.storeNumber === storeNumber ? { ...x, isActive: !x.isActive } : x,
        ),
      );
    }
  }, []);

  // --- Products ---
  const setProducts = useCallback(async (ps: Product[]) => {
    setProductsState(ps);
    try {
      const actor = await createActorWithConfig();
      await (actor as any).bulkImportProducts(ps);
    } catch (err) {
      console.error("bulkImportProducts failed", err);
      toast.error("Failed to save products to server.");
    }
  }, []);

  const addProduct = useCallback(async (p: Product) => {
    setProductsState((prev) => [...prev, p]);
    try {
      const actor = await createActorWithConfig();
      await (actor as any).addProduct(p);
    } catch (err) {
      console.error("addProduct failed", err);
      toast.error("Failed to save product.");
      setProductsState((prev) => prev.filter((x) => x.id !== p.id));
    }
  }, []);

  const updateProduct = useCallback(async (id: string, p: Product) => {
    setProductsState((prev) => prev.map((x) => (x.id === id ? p : x)));
    try {
      const actor = await createActorWithConfig();
      await (actor as any).editProduct(id, p);
    } catch (err) {
      console.error("editProduct failed", err);
      toast.error("Failed to update product.");
    }
  }, []);

  const deleteProduct = useCallback(
    async (id: string) => {
      const prev = products;
      setProductsState((p) => p.filter((x) => x.id !== id));
      try {
        const actor = await createActorWithConfig();
        await (actor as any).deleteProduct(id);
      } catch (err) {
        console.error("deleteProduct failed", err);
        toast.error("Failed to delete product.");
        setProductsState(prev);
      }
    },
    [products],
  );

  const toggleProduct = useCallback(async (id: string) => {
    setProductsState((prev) =>
      prev.map((x) => (x.id === id ? { ...x, isActive: !x.isActive } : x)),
    );
    try {
      const actor = await createActorWithConfig();
      await (actor as any).toggleProductState(id);
    } catch (err) {
      console.error("toggleProduct failed", err);
      toast.error("Failed to toggle product.");
      setProductsState((prev) =>
        prev.map((x) => (x.id === id ? { ...x, isActive: !x.isActive } : x)),
      );
    }
  }, []);

  // --- Orders ---
  const setOrders = useCallback(async (os: Order[]) => {
    setOrdersState(os);
    try {
      const actor = await createActorWithConfig();
      for (const o of os) {
        await (actor as any).addOrder(o);
      }
    } catch (err) {
      console.error("setOrders failed", err);
      toast.error("Failed to save orders to server.");
    }
  }, []);

  const addOrder = useCallback(async (o: Order) => {
    setOrdersState((prev) => [...prev, o]);
    try {
      const actor = await createActorWithConfig();
      await (actor as any).addOrder(o);
    } catch (err) {
      console.error("addOrder failed", err);
      toast.error("Failed to place order.");
      setOrdersState((prev) => prev.filter((x) => x.id !== o.id));
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (id: string, status: Order["status"]) => {
      setOrdersState((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                status,
                deliveredAt:
                  status === "delivered" ? BigInt(Date.now()) : x.deliveredAt,
              }
            : x,
        ),
      );
      try {
        const actor = await createActorWithConfig();
        await (actor as any).updateOrderStatus(id, status as any);
      } catch (err) {
        console.error("updateOrderStatus failed", err);
        toast.error("Failed to update order status.");
      }
    },
    [],
  );

  const deleteOrder = useCallback(async (id: string, reason: string) => {
    setOrdersState((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              isDeleted: true,
              deleteReason: reason,
              deletedAt: BigInt(Date.now()),
            }
          : x,
      ),
    );
    try {
      const actor = await createActorWithConfig();
      await (actor as any).deleteOrder(id, reason);
    } catch (err) {
      console.error("deleteOrder failed", err);
      toast.error("Failed to delete order.");
    }
  }, []);

  // --- Payments ---
  const setPayments = useCallback(async (ps: Payment[]) => {
    setPaymentsState(ps);
    try {
      const actor = await createActorWithConfig();
      for (const p of ps) {
        await (actor as any).addPayment(p);
      }
    } catch (err) {
      console.error("setPayments failed", err);
      toast.error("Failed to save payments to server.");
    }
  }, []);

  const addPayment = useCallback(async (p: Payment) => {
    setPaymentsState((prev) => [...prev, p]);
    try {
      const actor = await createActorWithConfig();
      await (actor as any).addPayment(p);
    } catch (err) {
      console.error("addPayment failed", err);
      toast.error("Failed to record payment.");
      setPaymentsState((prev) => prev.filter((x) => x.id !== p.id));
    }
  }, []);

  // --- Profile ---
  const updateProfile = useCallback(async (p: CompanyProfile) => {
    setProfileState(p);
    try {
      const actor = await createActorWithConfig();
      await (actor as any).updateCompanyProfile(p);
    } catch (err) {
      console.error("updateCompanyProfile failed", err);
      toast.error("Failed to save profile.");
    }
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e1b2e 40%, #0f1923 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 0 40px rgba(249,115,22,0.3)" }}
          >
            <img
              src="/assets/generated/ganesh-suppliers-logo-transparent.dim_300x300.png"
              alt="Ganesh Suppliers"
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#f97316", borderTopColor: "transparent" }}
          />
          <p
            className="text-sm font-medium"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Loading Ganesh Suppliers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DataStoreContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        toggleCustomer,
        setCustomers,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProduct,
        setProducts,
        orders,
        addOrder,
        updateOrderStatus,
        deleteOrder,
        setOrders,
        payments,
        addPayment,
        setPayments,
        profile,
        updateProfile,
        clearAllData,
        refreshData,
      }}
    >
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx)
    throw new Error("useDataStore must be used within DataStoreProvider");
  return ctx;
}
