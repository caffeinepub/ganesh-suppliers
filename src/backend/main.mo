import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";

import Storage "blob-storage/Storage";

import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  // Authorization
  type UserRole = AccessControl.UserRole;
  type AccessControlState = AccessControl.AccessControlState;
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    role : Text; // "admin" or "customer"
    customerId : ?Text; // For customers, links to their customer record
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Product Types
  public type Product = {
    id : Text;
    name : Text;
    unit : Text;
    rate : Float;
    isActive : Bool;
    imageUrl : ?Storage.ExternalBlob;
    createdAt : Time.Time;
  };

  // Comparison function for products by name
  func compareProductsByName(product1 : Product, product2 : Product) : Order.Order {
    Text.compare(product1.name, product2.name);
  };

  // Customer Types
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

  // Comparison function for customers by store number
  func compareCustomersByStoreNumber(customer1 : Customer, customer2 : Customer) : Order.Order {
    Text.compare(customer1.storeNumber, customer2.storeNumber);
  };

  // Payment Types
  public type PaymentMethod = {
    #cash;
    #online;
    #cheque;
  };

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

  // Comparison function for payments by recordedAt
  func comparePaymentsByRecordedAt(payment1 : Payment, payment2 : Payment) : Order.Order {
    Int.compare(payment1.recordedAt, payment2.recordedAt);
  };

  // Order Types
  public type OrderStatus = {
    #pending;
    #accepted;
    #delivered;
  };

  public type OrderItem = {
    productId : Text;
    productName : Text;
    unit : Text;
    rate : Float;
    quantity : Float;
    amount : Float;
  };

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
  };

  // Comparison function for orders by createdAt
  func compareOrdersByCreatedAt(order1 : Order, order2 : Order) : Order.Order {
    Int.compare(order1.createdAt, order2.createdAt);
  };

  // Company Profile
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

  var companyProfile : ?CompanyProfile = null;

  // Data Storage
  let products = Map.empty<Text, Product>();
  let customers = Map.empty<Text, Customer>();
  let orders = Map.empty<Text, Order>();
  let payments = Map.empty<Text, Payment>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Product Functions
  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func editProduct(productId : Text, product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can edit products");
    };
    if (not products.containsKey(productId)) {
      Runtime.trap("Product not found");
    };
    products.add(productId, product);
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    products.remove(productId);
  };

  public shared ({ caller }) func bulkImportProducts(productList : [Product]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can bulk import products");
    };
    for (product in productList.vals()) {
      products.add(product.id, product);
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view products");
    };
    products.values().toArray().sort(compareProductsByName);
  };

  public query ({ caller }) func getActiveProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view products");
    };
    products.values().toArray().filter(func(p) { p.isActive }).sort(compareProductsByName);
  };

  public shared ({ caller }) func toggleProductState(productId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle product state");
    };
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        let updatedProduct = { product with isActive = not product.isActive };
        products.add(productId, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func bulkToggleProducts(isActive : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can bulk toggle products");
    };
    for ((id, product) in products.entries()) {
      let updatedProduct = { product with isActive = isActive };
      products.add(id, updatedProduct);
    };
  };

  // Customer Functions
  public shared ({ caller }) func addCustomer(customer : Customer) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add customers");
    };
    if (customers.containsKey(customer.storeNumber)) {
      Runtime.trap("Store number already exists");
    };
    customers.add(customer.storeNumber, customer);
  };

  public shared ({ caller }) func editCustomer(storeNumber : Text, customer : Customer) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can edit customers");
    };
    if (not customers.containsKey(storeNumber)) {
      Runtime.trap("Customer not found");
    };
    customers.add(storeNumber, customer);
  };

  public shared ({ caller }) func deleteCustomer(storeNumber : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete customers");
    };
    customers.remove(storeNumber);
  };

  public query ({ caller }) func getCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all customers");
    };
    customers.values().toArray().sort(compareCustomersByStoreNumber);
  };

  public shared ({ caller }) func toggleCustomerState(storeNumber : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle customer state");
    };
    switch (customers.get(storeNumber)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) {
        let updatedCustomer = { customer with isActive = not customer.isActive };
        customers.add(storeNumber, updatedCustomer);
      };
    };
  };

  // Payment Functions
  public shared ({ caller }) func addPayment(payment : Payment) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add payments");
    };
    payments.add(payment.id, payment);
  };

  public query ({ caller }) func getPaymentsByCustomer(customerId : Text) : async [Payment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view payments");
    };

    // Verify caller is either admin or the customer themselves
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (userProfiles.get(caller)) {
        case (null) { Runtime.trap("User profile not found") };
        case (?profile) {
          switch (profile.customerId) {
            case (null) { Runtime.trap("Unauthorized: Not a customer") };
            case (?cid) {
              if (cid != customerId) {
                Runtime.trap("Unauthorized: Can only view your own payments");
              };
            };
          };
        };
      };
    };

    payments.values().toArray().filter(func(p) { p.customerId == customerId }).sort(comparePaymentsByRecordedAt);
  };

  public query ({ caller }) func getAllPayments() : async [Payment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all payments");
    };
    payments.values().toArray().sort(comparePaymentsByRecordedAt);
  };

  // Order Functions
  public shared ({ caller }) func addOrder(order : Order) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create orders");
    };

    // Verify caller is creating order for themselves (not admin bypass)
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (userProfiles.get(caller)) {
        case (null) { Runtime.trap("User profile not found") };
        case (?profile) {
          switch (profile.customerId) {
            case (null) { Runtime.trap("Unauthorized: Not a customer") };
            case (?cid) {
              if (cid != order.customerId) {
                Runtime.trap("Unauthorized: Can only create orders for yourself");
              };
            };
          };
        };
      };
    };

    orders.add(order.id, order);
  };

  public query ({ caller }) func getOrdersByCustomer(customerId : Text) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view orders");
    };

    // Verify caller is either admin or the customer themselves
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (userProfiles.get(caller)) {
        case (null) { Runtime.trap("User profile not found") };
        case (?profile) {
          switch (profile.customerId) {
            case (null) { Runtime.trap("Unauthorized: Not a customer") };
            case (?cid) {
              if (cid != customerId) {
                Runtime.trap("Unauthorized: Can only view your own orders");
              };
            };
          };
        };
      };
    };

    orders.values().toArray().filter(func(o) { o.customerId == customerId }).sort(compareOrdersByCreatedAt);
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray().sort(compareOrdersByCreatedAt);
  };

  public query ({ caller }) func getOrdersByStatus(status : OrderStatus) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can filter orders by status");
    };
    orders.values().toArray().filter(func(o) { o.status == status }).sort(compareOrdersByCreatedAt);
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Text, newStatus : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let deliveredAt = if (newStatus == #delivered) {
          ?Time.now();
        } else {
          order.deliveredAt;
        };
        let updatedOrder = {
          order with
          status = newStatus;
          deliveredAt = deliveredAt;
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  // Dashboard Stats
  public type DashboardStats = {
    totalOrders : Nat;
    todayOrders : Nat;
    todayRevenue : Float;
    totalRevenue : Float;
    totalCustomers : Nat;
    totalProducts : Nat;
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view dashboard stats");
    };

    let now = Time.now();
    let oneDayNanos : Int = 24 * 60 * 60 * 1_000_000_000;
    let todayStart = now - oneDayNanos;

    var totalRevenue : Float = 0.0;
    var todayRevenue : Float = 0.0;
    var todayOrders : Nat = 0;

    for (order in orders.values()) {
      totalRevenue += order.totalAmount;
      if (order.createdAt >= todayStart) {
        todayRevenue += order.totalAmount;
        todayOrders += 1;
      };
    };

    {
      totalOrders = orders.size();
      todayOrders = todayOrders;
      todayRevenue = todayRevenue;
      totalRevenue = totalRevenue;
      totalCustomers = customers.size();
      totalProducts = products.size();
    };
  };

  // Company Profile Functions
  public shared ({ caller }) func updateCompanyProfile(profile : CompanyProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update company profile");
    };
    companyProfile := ?profile;
  };

  public query ({ caller }) func getCompanyProfile() : async ?CompanyProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view company profile");
    };
    companyProfile;
  };

  // Helper functions (kept for backward compatibility)
  func assertAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action.");
    };
  };

  func assertCustomer(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only customers can perform this action.");
    };
  };
};
