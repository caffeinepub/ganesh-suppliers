import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Product {
    id: string;
    name: string;
    createdAt: Time;
    rate: number;
    unit: string;
    isActive: boolean;
    imageUrl?: ExternalBlob;
}
export interface CompanyProfile {
    bankAccountNumber: string;
    contact: string;
    adminPasswordHash: string;
    ifscCode: string;
    gstNumber: string;
    email: string;
    bankName: string;
    appVersion: string;
    logoUrl?: ExternalBlob;
    adminUserId: string;
    signatureUrl?: ExternalBlob;
    address: string;
    upiQrImageUrl?: ExternalBlob;
    upiId: string;
    companyName: string;
    bankAccountName: string;
    branchName: string;
}
export type Time = bigint;
export interface OrderItem {
    rate: number;
    unit: string;
    productId: string;
    productName: string;
    quantity: number;
    amount: number;
}
export interface Payment {
    id: string;
    paymentMethod: PaymentMethod;
    referenceNumber: string;
    storeNumber: string;
    recordedAt: Time;
    notes: string;
    companyName: string;
    customerId: string;
    amount: number;
}
export interface DashboardStats {
    totalProducts: bigint;
    totalOrders: bigint;
    todayRevenue: number;
    totalRevenue: number;
    totalCustomers: bigint;
    todayOrders: bigint;
}
export interface Order {
    id: string;
    status: OrderStatus;
    deliveredAt?: Time;
    storeNumber: string;
    createdAt: Time;
    invoiceNumber: string;
    totalAmount: number;
    address: string;
    companyName: string;
    customerId: string;
    items: Array<OrderItem>;
}
export interface Customer {
    id: string;
    customerName: string;
    storeNumber: string;
    gstNumber: string;
    userId?: string;
    createdAt: Time;
    isActive: boolean;
    email: string;
    address: string;
    companyName: string;
    passwordHash: string;
    phone: string;
}
export interface UserProfile {
    name: string;
    role: string;
    customerId?: string;
}
export enum OrderStatus {
    pending = "pending",
    delivered = "delivered",
    accepted = "accepted"
}
export enum PaymentMethod {
    cash = "cash",
    cheque = "cheque",
    online = "online"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCustomer(customer: Customer): Promise<void>;
    addOrder(order: Order): Promise<void>;
    addPayment(payment: Payment): Promise<void>;
    addProduct(product: Product): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkImportProducts(productList: Array<Product>): Promise<void>;
    bulkToggleProducts(isActive: boolean): Promise<void>;
    deleteCustomer(storeNumber: string): Promise<void>;
    deleteProduct(productId: string): Promise<void>;
    editCustomer(storeNumber: string, customer: Customer): Promise<void>;
    editProduct(productId: string, product: Product): Promise<void>;
    getActiveProducts(): Promise<Array<Product>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllPayments(): Promise<Array<Payment>>;
    getAllProducts(): Promise<Array<Product>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompanyProfile(): Promise<CompanyProfile | null>;
    getCustomers(): Promise<Array<Customer>>;
    getDashboardStats(): Promise<DashboardStats>;
    getOrdersByCustomer(customerId: string): Promise<Array<Order>>;
    getOrdersByStatus(status: OrderStatus): Promise<Array<Order>>;
    getPaymentsByCustomer(customerId: string): Promise<Array<Payment>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleCustomerState(storeNumber: string): Promise<void>;
    toggleProductState(productId: string): Promise<void>;
    updateCompanyProfile(profile: CompanyProfile): Promise<void>;
    updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void>;
}
