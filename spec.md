# Ganesh Suppliers

## Current State
The app uses a Motoko backend on the Internet Computer for cross-device data sync. However, the storage variables (customers, products, orders, payments, companyProfile) are declared as regular `let`/`var` instead of `stable var`, causing all data to be wiped every time the canister is upgraded (i.e., every deployment).

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- `src/backend/main.mo`: Change all primary data storage variables to `stable var` so data survives canister upgrades and redeployments:
  - `ordersV2`, `products`, `customers`, `payments` → `stable var`
  - `companyProfile` → `stable var`

### Remove
- Nothing removed

## Implementation Plan
1. Declare `ordersV2`, `products`, `customers`, `payments`, and `companyProfile` as `stable var` in `main.mo`
2. Keep migration stubs (absorbed old stable vars) as-is to avoid upgrade errors
