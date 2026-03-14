// This file is kept for backward compatibility.
// All order management now goes through dataStore.tsx with localStorage persistence.
import type { Order } from "./backend.d";

export function addCustomerOrder(_order: Order) {
  // No-op: use useDataStore().addOrder instead
}

export function getAllOrdersWithCustomer(): Order[] {
  // No-op: use useDataStore().orders instead
  return [];
}
