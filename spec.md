# Ganesh Suppliers

## Current State
The app has a full Motoko backend (main.mo) with all data types (Products, Customers, Orders, Payments, CompanyProfile) and an authorization component. However, the frontend (dataStore.tsx) completely bypasses the backend and uses only browser localStorage for all data. This causes each device to have its own isolated dataset, so login from a second device fails because customers created on device A don't exist on device B.

The backend currently:
- Uses ICP principal-based authorization (admin/user roles via Internet Identity)
- Does NOT have `isDeleted`/`deleteReason` fields on Order
- Does NOT have a public customer login function
- Has no `deleteOrder` function

The frontend currently:
- Uses localStorage for all reads/writes
- Has custom username/password login (admin: email+password, customers: storeNumber+password)
- Has `isDeleted`, `deleteReason`, `deletedAt` fields on Order
- Has `deleteOrder(id, reason)` in the dataStore

## Requested Changes (Diff)

### Add
- `isDeleted: Bool`, `deleteReason: Text`, `deletedAt: ?Time.Time` fields to Order type in backend
- `deleteOrder(orderId: Text, reason: Text)` backend function (marks as deleted, does not physically delete)
- `customerLogin(storeNumber: Text, password: Text)` public query function returning `?Customer`
- `getPublicCompanyProfile()` anonymous query function for login page branding
- Backend functions callable without ICP Internet Identity (remove principal-based access control, use stored admin password for admin auth)
- A simple `adminVerify(password: Text)` query that returns Bool
- `bulkImportCustomers(customers: [Customer])` function

### Modify
- Remove all `AccessControl.hasPermission` / `assertAdmin` / `assertCustomer` checks from all backend functions -- make all data endpoints accessible without ICP authentication (the app manages its own login via stored passwords)
- `dataStore.tsx`: Replace all localStorage read/write operations with async backend canister calls. Add loading states. Keep the same context API surface so consuming components need minimal changes.
- `LoginPage.tsx`: Use backend `customerLogin` and `adminVerify` functions instead of checking against localStorage data

### Remove
- localStorage usage for all core data (customers, products, orders, payments, profile, adminPassword)
- The authorization/access-control dependency from main.mo (or keep the mixin but don't use it for data endpoints)

## Implementation Plan
1. Regenerate Motoko backend: remove access control on data endpoints, add isDeleted/deleteReason/deletedAt to Order, add deleteOrder function, add customerLogin public query, add adminVerify query, add bulkImportCustomers
2. Update frontend dataStore.tsx to be async -- load data from backend on mount, write to backend on mutations
3. Update LoginPage.tsx to call backend for auth
4. Add loading/error states in the app root
5. Seed initial data from mockData on first load if backend is empty
