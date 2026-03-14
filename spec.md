# Ganesh Suppliers - Customer Portal Activation

## Current State
- Admin portal is fully built with Dashboard, Products, Customers, Orders & Invoices, Accounts, Profile sections.
- Login page exists with both Admin and Customer login flows.
- Customer login currently accepts any store number + password (no actual validation).
- Customer portal shows nothing (view === 'customer' is unhandled in App.tsx).
- Admin login uses username 'admin' / password 'admin123'.
- Mock data includes 22 customers each with storeNumber and passwordHash ('pass123').

## Requested Changes (Diff)

### Add
- `CustomerLayout.tsx` - Full customer portal shell with sidebar nav: Dashboard / Place New Order / My Completed Orders / My Statement
- `CustomerDashboard.tsx` - Shows company name header, store details, 3 stat cards: Total Orders / Total Purchase Amount / Balance Due Amount
- `CustomerPlaceOrder.tsx` - Product catalog browsing, add-to-cart, Favorites section per product, Cart view with UPI Payment (show QR code + deep-link redirect to payment apps) and Pay Later options; on order placed redirect to dashboard
- `CustomerCompletedOrders.tsx` - All delivered orders for logged-in customer with Print and PDF download (using window.print)
- `CustomerStatement.tsx` - Date range filter (from/to + quick selectors: This Month / Last Month / 3 Months / Last 366 Days), statement table, Print and PDF download
- Customer login validation against mockCustomers by storeNumber + passwordHash
- Pass logged-in customer object from LoginPage through App.tsx to CustomerLayout
- UPI payment flow: show QR image from company profile + deep-link button to open payment apps with amount; after confirming payment reference ID, complete order with paymentMethod=online
- Pay Later flow: create order with paymentMethod indicated as 'payLater'; show in invoices and statements
- Both invoice and statement documents include payment method label (UPI Advance Paid / Pay Later)

### Modify
- `App.tsx` - Handle `view === 'customer'` by rendering CustomerLayout with the logged-in customer data; pass onLogout to go back to login
- `LoginPage.tsx` - Validate customer login: storeNumber must match a customer record and password must match passwordHash; on success pass customer data up; Change admin login credentials to email 'admin@ganeshsuppliers.com' and password 'Admin@1234'
- Admin login hint updated to reflect new credentials

### Remove
- Nothing removed

## Implementation Plan
1. Update App.tsx to hold loggedInCustomer state and pass it to CustomerLayout
2. Update LoginPage.tsx: admin credentials to admin@ganeshsuppliers.com / Admin@1234; customer login validates against mockCustomers
3. Create CustomerLayout.tsx with sidebar (Dashboard, Place New Order, My Completed Orders, My Statement) and mobile hamburger menu
4. Create CustomerDashboard.tsx with company name, store details, 3 stat cards calculated from customer's orders and payments
5. Create CustomerPlaceOrder.tsx with product grid, favorites, cart, UPI payment (QR + deep link), Pay Later, order placement
6. Create CustomerCompletedOrders.tsx with list of delivered orders, inline invoice detail, Print and PDF download
7. Create CustomerStatement.tsx with date range picker, quick range buttons, statement ledger table, Print and PDF download
8. Add paymentMethod and paymentReference fields to Order display (invoice and statement)
