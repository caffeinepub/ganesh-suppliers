import type { Order } from "./backend.d";
import { mockOrders } from "./mockData";

const newOrders: Order[] = [];

export function addCustomerOrder(order: Order) {
  newOrders.push(order);
}

export function getAllOrdersWithCustomer(): Order[] {
  return [...mockOrders, ...newOrders];
}
