import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  // ---------------------------------------------------------------------------
  // Types
  // ---------------------------------------------------------------------------

  public type UserRole = { #admin; #user; #guest };

  public type UserProfile = {
    name : Text;
    role : Text;
    customerId : ?Text;
  };

  public type Product = {
    id : Text;
    name : Text;
    unit : Text;
    rate : Float;
    isActive : Bool;
    imageUrl : ?Storage.ExternalBlob;
    createdAt : Time.Time;
  };

  public type Customer = {
    id : Text;
    storeNumber : Text;
    customerName : Text;
    phone : Text;
    companyName : Text;
    address : Text;
    gstNumber : Text;
    email : Text;
    passwordHash : Text;
    isActive : Bool;
    createdAt : Time.Time;
    userId : ?Text;
  };

  public type PaymentMethod = { #cash; #online; #cheque };

  public type Payment = {
    id : Text;
    customerId : Text;
    storeNumber : Text;
    companyName : Text;
    amount : Float;
    paymentMethod : PaymentMethod;
    referenceNumber : Text;
    recordedAt : Time.Time;
    notes : Text;
  };

  public type OrderStatus = { #pending; #accepted; #delivered };

  public type OrderItem = {
    productId : Text;
    productName : Text;
    unit : Text;
    rate : Float;
    quantity : Float;
    amount : Float;
  };

  // V1 Order type (used only for migration from old canister state)
  type OrderV1 = {
    id : Text;
    customerId : Text;
    storeNumber : Text;
    companyName : Text;
    address : Text;
    items : [OrderItem];
    totalAmount : Float;
    status : OrderStatus;
    createdAt : Time.Time;
    deliveredAt : ?Time.Time;
    invoiceNumber : Text;
  };

  // Current Order type
  public type Order = {
    id : Text;
    customerId : Text;
    storeNumber : Text;
    companyName : Text;
    address : Text;
    items : [OrderItem];
    totalAmount : Float;
    status : OrderStatus;
    createdAt : Time.Time;
    deliveredAt : ?Time.Time;
    invoiceNumber : Text;
    isDeleted : Bool;
    deleteReason : Text;
    deletedAt : ?Time.Time;
  };

  public type CompanyProfile = {
    logoUrl : ?Storage.ExternalBlob;
    companyName : Text;
    gstNumber : Text;
    contact : Text;
    email : Text;
    address : Text;
    bankAccountNumber : Text;
    bankAccountName : Text;
    bankName : Text;
    ifscCode : Text;
    upiId : Text;
    branchName : Text;
    upiQrImageUrl : ?Storage.ExternalBlob;
    signatureUrl : ?Storage.ExternalBlob;
    adminUserId : Text;
    adminPasswordHash : Text;
    appVersion : Text;
  };

  public type DashboardStats = {
    totalOrders : Nat;
    todayOrders : Nat;
    todayRevenue : Float;
    totalRevenue : Float;
    totalCustomers : Nat;
    totalProducts : Nat;
  };

  // ---------------------------------------------------------------------------
  // Stable storage
  //
  // MIGRATION NOTES:
  //   - accessControlState: absorbed from old canister (was created by MixinAuthorization);
  //     kept here to prevent "cannot be implicitly discarded" error; never used.
  //   - userProfiles: absorbed from old canister; kept here; never used.
  //   - orders: the V1 stable var (old Order type, no isDeleted/deleteReason/deletedAt);
  //     migrated to ordersV2 in postupgrade.
  //   - ordersV2: current Order storage (with isDeleted etc.).
  // ---------------------------------------------------------------------------

  // Absorb old stable var: accessControlState (from MixinAuthorization, no longer used)
  let accessControlState : { var adminAssigned : Bool; userRoles : Map.Map<Principal, UserRole> } = {
    var adminAssigned = false;
    userRoles = Map.empty<Principal, UserRole>();
  };

  // Absorb old stable var: userProfiles (no longer used)
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Absorb old stable var: orders (V1 type, migrated to ordersV2 in postupgrade)
  let orders = Map.empty<Text, OrderV1>();

  // Current storage
  let ordersV2 = Map.empty<Text, Order>();
  let products = Map.empty<Text, Product>();
  let customers = Map.empty<Text, Customer>();
  let payments = Map.empty<Text, Payment>();
  var companyProfile : ?CompanyProfile = null;

  // Migrate V1 orders to current format after upgrade
  system func postupgrade<system>() {
    for ((id, o) in orders.entries()) {
      ordersV2.add(
        id,
        {
          id = o.id;
          customerId = o.customerId;
          storeNumber = o.storeNumber;
          companyName = o.companyName;
          address = o.address;
          items = o.items;
          totalAmount = o.totalAmount;
          status = o.status;
          createdAt = o.createdAt;
          deliveredAt = o.deliveredAt;
          invoiceNumber = o.invoiceNumber;
          isDeleted = false;
          deleteReason = "";
          deletedAt = null;
        },
      );
    };
  };

  // ---------------------------------------------------------------------------
  // Sort helpers
  // ---------------------------------------------------------------------------

  func compareByName(a : Product, b : Product) : Order.Order {
    Text.compare(a.name, b.name);
  };

  func compareCustomers(a : Customer, b : Customer) : Order.Order {
    Text.compare(a.storeNumber, b.storeNumber);
  };

  func compareOrdersDesc(a : Order, b : Order) : Order.Order {
    Int.compare(b.createdAt, a.createdAt);
  };

  func comparePayments(a : Payment, b : Payment) : Order.Order {
    Int.compare(a.recordedAt, b.recordedAt);
  };

  // ---------------------------------------------------------------------------
  // Product functions
  // ---------------------------------------------------------------------------

  public shared func addProduct(product : Product) : async () {
    products.add(product.id, product);
  };

  public shared func editProduct(productId : Text, product : Product) : async () {
    if (not products.containsKey(productId)) { Runtime.trap("Product not found") };
    products.add(productId, product);
  };

  public shared func deleteProduct(productId : Text) : async () {
    products.remove(productId);
  };

  public shared func bulkImportProducts(productList : [Product]) : async () {
    for (p in productList.vals()) { products.add(p.id, p) };
  };

  public query func getAllProducts() : async [Product] {
    products.values().toArray().sort(compareByName);
  };

  public query func getActiveProducts() : async [Product] {
    products
      .values()
      .toArray()
      .filter(func(p : Product) : Bool { p.isActive })
      .sort(compareByName);
  };

  public shared func toggleProductState(productId : Text) : async () {
    switch (products.get(productId)) {
      case null { Runtime.trap("Product not found") };
      case (?p) { products.add(productId, { p with isActive = not p.isActive }) };
    };
  };

  public shared func bulkToggleProducts(isActive : Bool) : async () {
    for ((id, p) in products.entries()) {
      products.add(id, { p with isActive = isActive });
    };
  };

  // ---------------------------------------------------------------------------
  // Customer functions
  // ---------------------------------------------------------------------------

  public shared func addCustomer(customer : Customer) : async () {
    if (customers.containsKey(customer.storeNumber)) {
      Runtime.trap("Store number already exists");
    };
    customers.add(customer.storeNumber, customer);
  };

  public shared func editCustomer(storeNumber : Text, customer : Customer) : async () {
    if (not customers.containsKey(storeNumber)) { Runtime.trap("Customer not found") };
    customers.add(storeNumber, customer);
  };

  public shared func deleteCustomer(storeNumber : Text) : async () {
    customers.remove(storeNumber);
  };

  public shared func bulkImportCustomers(customerList : [Customer]) : async () {
    for (c in customerList.vals()) { customers.add(c.storeNumber, c) };
  };

  public query func getCustomers() : async [Customer] {
    customers.values().toArray().sort(compareCustomers);
  };

  public shared func toggleCustomerState(storeNumber : Text) : async () {
    switch (customers.get(storeNumber)) {
      case null { Runtime.trap("Customer not found") };
      case (?c) { customers.add(storeNumber, { c with isActive = not c.isActive }) };
    };
  };

  public query func customerLogin(storeNumber : Text, password : Text) : async ?Customer {
    switch (customers.get(storeNumber)) {
      case null { null };
      case (?c) {
        if (c.passwordHash == password and c.isActive) { ?c } else { null };
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Order functions (all use ordersV2)
  // ---------------------------------------------------------------------------

  public shared func addOrder(order : Order) : async () {
    ordersV2.add(order.id, order);
  };

  public query func getAllOrders() : async [Order] {
    ordersV2.values().toArray().sort(compareOrdersDesc);
  };

  public query func getOrdersByCustomer(customerId : Text) : async [Order] {
    ordersV2
      .values()
      .toArray()
      .filter(func(o : Order) : Bool { o.customerId == customerId })
      .sort(compareOrdersDesc);
  };

  public query func getOrdersByStatus(status : OrderStatus) : async [Order] {
    ordersV2
      .values()
      .toArray()
      .filter(func(o : Order) : Bool { o.status == status })
      .sort(compareOrdersDesc);
  };

  public shared func updateOrderStatus(orderId : Text, newStatus : OrderStatus) : async () {
    switch (ordersV2.get(orderId)) {
      case null { Runtime.trap("Order not found") };
      case (?o) {
        let deliveredAt = if (newStatus == #delivered) { ?Time.now() } else { o.deliveredAt };
        ordersV2.add(orderId, { o with status = newStatus; deliveredAt = deliveredAt });
      };
    };
  };

  public shared func deleteOrder(orderId : Text, reason : Text) : async () {
    switch (ordersV2.get(orderId)) {
      case null { Runtime.trap("Order not found") };
      case (?o) {
        ordersV2.add(
          orderId,
          { o with isDeleted = true; deleteReason = reason; deletedAt = ?Time.now() },
        );
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Payment functions
  // ---------------------------------------------------------------------------

  public shared func addPayment(payment : Payment) : async () {
    payments.add(payment.id, payment);
  };

  public query func getAllPayments() : async [Payment] {
    payments.values().toArray().sort(comparePayments);
  };

  public query func getPaymentsByCustomer(customerId : Text) : async [Payment] {
    payments
      .values()
      .toArray()
      .filter(func(p : Payment) : Bool { p.customerId == customerId })
      .sort(comparePayments);
  };

  // ---------------------------------------------------------------------------
  // Company Profile
  // ---------------------------------------------------------------------------

  public shared func updateCompanyProfile(profile : CompanyProfile) : async () {
    companyProfile := ?profile;
  };

  public query func getCompanyProfile() : async ?CompanyProfile {
    companyProfile;
  };

  public query func adminVerify(password : Text) : async Bool {
    switch (companyProfile) {
      case null { password == "Admin@1234" };
      case (?p) { p.adminPasswordHash == password };
    };
  };

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------

  public query func getDashboardStats() : async DashboardStats {
    let now = Time.now();
    let oneDayNanos : Int = 24 * 60 * 60 * 1_000_000_000;
    let todayStart = now - oneDayNanos;

    var totalRevenue : Float = 0.0;
    var todayRevenue : Float = 0.0;
    var todayOrders : Nat = 0;

    for (o in ordersV2.values()) {
      if (not o.isDeleted) {
        totalRevenue += o.totalAmount;
        if (o.createdAt >= todayStart) {
          todayRevenue += o.totalAmount;
          todayOrders += 1;
        };
      };
    };

    {
      totalOrders = ordersV2.size();
      todayOrders = todayOrders;
      todayRevenue = todayRevenue;
      totalRevenue = totalRevenue;
      totalCustomers = customers.size();
      totalProducts = products.size();
    };
  };

  // ---------------------------------------------------------------------------
  // Backward-compat stubs (referenced by backend.d.ts / old frontend bindings)
  // ---------------------------------------------------------------------------

  public shared ({ caller }) func assignCallerUserRole(_user : Principal, _role : UserRole) : async () {};

  public query ({ caller = _ }) func getCallerUserProfile() : async ?UserProfile { null };

  public query ({ caller = _ }) func getCallerUserRole() : async UserRole { #guest };

  public query ({ caller = _ }) func getUserProfile(_user : Principal) : async ?UserProfile { null };

  public query ({ caller = _ }) func isCallerAdmin() : async Bool { false };

  public shared ({ caller = _ }) func saveCallerUserProfile(_profile : UserProfile) : async () {};
};
