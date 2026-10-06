const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface DecodedToken {
  sub: string;
  email: string;
  role: "AFFILIATE" | "SUPPLIER" | "ADMIN" | "CALL_CENTER_AGENT";
  tenantId?: string;
  exp?: number;
}

export function parseJwt(token: string): DecodedToken | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vitedrop_token");
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("vitedrop_token", token);
}

export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("vitedrop_token");
}

export function getCurrentUser(): DecodedToken | null {
  const token = getAuthToken();
  if (!token) return null;
  return parseJwt(token);
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    const message =
      data?.message ||
      (Array.isArray(data?.message) ? data.message.join(", ") : null) ||
      `Erreur serveur (${response.status})`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return data as T;
}

// Auth API Methods
export async function apiLogin(credentials: {
  email: string;
  password: string;
}): Promise<{ access_token: string; user: DecodedToken | null }> {
  const res = await apiRequest<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  if (res?.access_token) {
    setAuthToken(res.access_token);
    const user = parseJwt(res.access_token);
    return { access_token: res.access_token, user };
  }

  throw new Error("Jeton d'authentification invalide.");
}

export async function apiRegisterAffiliate(data: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<{ access_token: string; user: DecodedToken | null }> {
  const res = await apiRequest<{ access_token: string }>(
    "/auth/register/affiliate",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (res?.access_token) {
    setAuthToken(res.access_token);
    const user = parseJwt(res.access_token);
    return { access_token: res.access_token, user };
  }

  throw new Error("Échec de la création de compte affilié.");
}

export async function apiRegisterSupplier(data: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<{ access_token: string; user: DecodedToken | null }> {
  const res = await apiRequest<{ access_token: string }>(
    "/auth/register/supplier",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (res?.access_token) {
    setAuthToken(res.access_token);
    const user = parseJwt(res.access_token);
    return { access_token: res.access_token, user };
  }

  throw new Error("Échec de la création de compte fournisseur.");
}

// Wallet API Methods
export async function apiGetMyWallet(): Promise<{
  id: string;
  balance: number;
  ownerType: string;
}> {
  return apiRequest("/wallets/me");
}

export async function apiGetTransactions(limit = 20, offset = 0) {
  return apiRequest<{ data: any[]; total: number; limit: number; offset: number }>(
    `/wallets/transactions?limit=${limit}&offset=${offset}`
  );
}

export async function apiWithdrawWallet(
  amount: number,
  method: string,
  recipientDetails: string
): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
  return apiRequest("/wallets/withdraw", {
    method: "POST",
    body: JSON.stringify({ amount, method, recipientDetails }),
  });
}

// Marketplace API Methods
export async function apiGetMarketplaceProducts(): Promise<any[]> {
  return apiRequest("/affiliate/marketplace");
}

export async function apiGetProductDetails(id: string): Promise<any> {
  return apiRequest(`/affiliate/marketplace/${id}`);
}

// Public Customer Checkout API Methods (Anonymous access)
export interface PublicCheckoutProduct {
  id: string;
  name: string;
  description: string | null;
  retailPrice: number;
  stock: number;
}

export async function apiGetPublicProduct(id: string): Promise<PublicCheckoutProduct> {
  return apiRequest<PublicCheckoutProduct>(`/checkout/product/${id}`);
}

export interface CreateCheckoutPayload {
  customerName: string;
  customerPhone: string;
  wilaya: number;
  commune: string;
  address: string;
  productId: string;
  quantity: number;
  affiliateId: string;
  fbclid?: string;
  ttclid?: string;
}

export async function apiCreateCheckoutLead(
  payload: CreateCheckoutPayload
): Promise<{ success: boolean; orderId: string }> {
  return apiRequest<{ success: boolean; orderId: string }>("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Affiliate Orders Tracking API
export interface AffiliateOrder {
  id: string;
  affiliateId: string;
  cpaCommission: string | number;
  status: string;
  customerName: string;
  customerPhone: string;
  address: string;
  productId: string;
  productName?: string;
  quantity: number;
  wilaya: number;
  commune: string;
  trackingNumber: string | null;
  courier: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function apiGetAffiliateOrders(): Promise<AffiliateOrder[]> {
  return apiRequest<AffiliateOrder[]>("/affiliate/orders");
}

// Supplier & Call Center Fulfillment API
export interface SupplierOrder {
  id: string;
  supplierId: string;
  affiliateId: string;
  cpaCommission: string | number;
  platformFee: string | number;
  status: string;
  customerName: string;
  customerPhone: string;
  address: string;
  productId: string;
  productName?: string;
  quantity: number;
  wilaya: number;
  commune: string;
  trackingNumber: string | null;
  courier: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function apiGetSupplierLeads(): Promise<SupplierOrder[]> {
  return apiRequest<SupplierOrder[]>("/supplier/call-center/leads");
}

export async function apiGetSupplierOrders(): Promise<SupplierOrder[]> {
  return apiRequest<SupplierOrder[]>("/supplier/orders");
}

export async function apiConfirmSupplierLead(orderId: string): Promise<SupplierOrder> {
  return apiRequest<SupplierOrder>(`/supplier/call-center/${orderId}/confirm`, {
    method: "PATCH",
  });
}

export async function apiCancelSupplierLead(
  orderId: string,
  cancellationReason: string
): Promise<SupplierOrder> {
  return apiRequest<SupplierOrder>(`/supplier/call-center/${orderId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ cancellationReason }),
  });
}

export async function apiDispatchSupplierOrder(orderId: string): Promise<SupplierOrder> {
  return apiRequest<SupplierOrder>(`/supplier/call-center/${orderId}/dispatch`, {
    method: "POST",
  });
}

export async function apiSimulateCourierWebhook(
  trackingNumber: string,
  status: "Livre" | "Retour"
): Promise<any> {
  return apiRequest("/webhooks/courier/yalidine", {
    method: "POST",
    body: JSON.stringify({
      trackingNumber,
      status,
    }),
  });
}

// Admin API Methods
export async function apiGetAdminStats(): Promise<{
  totalAffiliates: number;
  totalSuppliers: number;
  totalOrders: number;
  totalSupplierEscrow: number;
  totalAffiliateLiability: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  platformRevenue: number;
}> {
  return apiRequest("/admin/stats");
}

export type WithdrawalStatus = "PENDING" | "APPROVED" | "PAID" | "REJECTED" | "FAILED";
export type WithdrawalMethod = "BARIDIMOB" | "CCP" | "BANK_TRANSFER";

export interface AdminWithdrawal {
  id: string;
  userId: string;
  userEmail?: string;
  fullName?: string | null;
  userPhone?: string | null;
  userRole?: string;
  amount: number;
  method: WithdrawalMethod;
  recipientDetailsMasked: string;
  recipientDetailsEncrypted?: string | null;
  status: WithdrawalStatus;
  adminNote?: string | null;
  paymentReference?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  paidAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
}

export async function apiGetAdminWithdrawals(
  status?: string,
  limit = 50,
  offset = 0
): Promise<{ data: AdminWithdrawal[]; total: number; limit: number; offset: number }> {
  const query = new URLSearchParams();
  if (status && status !== "ALL") query.set("status", status);
  query.set("limit", String(limit));
  query.set("offset", String(offset));
  return apiRequest(`/admin/withdrawals?${query.toString()}`);
}

export async function apiGetAdminWithdrawal(id: string): Promise<AdminWithdrawal> {
  return apiRequest(`/admin/withdrawals/${id}`);
}

export async function apiApproveWithdrawal(id: string, adminNote?: string): Promise<AdminWithdrawal> {
  return apiRequest(`/admin/withdrawals/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ adminNote }),
  });
}

export async function apiRejectWithdrawal(id: string, reason: string): Promise<AdminWithdrawal> {
  return apiRequest(`/admin/withdrawals/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function apiMarkWithdrawalPaid(
  id: string,
  paymentReference: string,
  adminNote?: string
): Promise<AdminWithdrawal> {
  return apiRequest(`/admin/withdrawals/${id}/paid`, {
    method: "PATCH",
    body: JSON.stringify({ paymentReference, adminNote }),
  });
}

export async function apiMarkWithdrawalFailed(id: string, reason: string): Promise<AdminWithdrawal> {
  return apiRequest(`/admin/withdrawals/${id}/failed`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function apiGetPendingWithdrawals(): Promise<AdminWithdrawal[]> {
  return apiRequest("/admin/withdrawals/pending");
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: "ADMIN" | "AFFILIATE" | "SUPPLIER" | "CALL_CENTER_AGENT";
  isActive: boolean;
  createdAt: string;
  balance: number;
  walletId: string | null;
}

export async function apiGetAdminUsers(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>("/admin/users");
}

export async function apiUpdateUserStatus(id: string, isActive: boolean): Promise<{ success: boolean; id: string; isActive: boolean }> {
  return apiRequest(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function apiUpdateUserRole(id: string, role: string): Promise<{ success: boolean; id: string; role: string }> {
  return apiRequest(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

// Supplier Products
export async function apiGetSupplierProducts(): Promise<any[]> {
  return apiRequest("/supplier/products");
}

export async function apiCreateSupplierProduct(data: {
  name: string;
  description?: string;
  stock: number;
  retailPrice: number;
  supplierTotalCpa: number;
}): Promise<any> {
  return apiRequest("/supplier/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ----------------------------------------------------
// Admin Orders API
// ----------------------------------------------------
export interface AdminOrderListItem {
  id: string;
  customerName: string;
  customerPhone: string;
  wilaya: number;
  commune: string;
  address: string;
  productId: string;
  productName?: string;
  quantity: number;
  supplierId: string;
  supplierName?: string;
  affiliateId: string;
  affiliateName?: string;
  status: string;
  trackingNumber: string | null;
  courier: string | null;
  cpaCommission: number;
  platformFee: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderQuery {
  status?: string;
  supplierId?: string;
  affiliateId?: string;
  wilaya?: number;
  trackingNumber?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AdminOrderEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  triggerSource: string;
  reason?: string | null;
  metadata?: any;
  createdAt: string;
}

export interface AdminOrderNote {
  id: string;
  adminId: string;
  note: string;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrderListItem {
  cancellationReason?: string | null;
  click_id?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  sub_id?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  events?: AdminOrderEvent[];
  notes?: AdminOrderNote[];
  transactions?: Array<{
    id: string;
    walletId: string;
    type: string;
    amount: number;
    balanceAfter: number | null;
    createdAt: string;
  }>;
  inventoryMovements?: Array<{
    id: string;
    movementType: string;
    quantity: number;
    reference: string | null;
    createdAt: string;
  }>;
}

export async function apiGetAdminOrders(
  query: AdminOrderQuery = {}
): Promise<{ data: AdminOrderListItem[]; total: number; limit: number; offset: number }> {
  const params = new URLSearchParams();
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.supplierId) params.set("supplierId", query.supplierId);
  if (query.affiliateId) params.set("affiliateId", query.affiliateId);
  if (query.wilaya) params.set("wilaya", String(query.wilaya));
  if (query.trackingNumber) params.set("trackingNumber", query.trackingNumber);
  if (query.search) params.set("search", query.search);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) {
    params.set(
      "page",
      String(Math.floor(query.offset / (query.limit || 20)) + 1)
    );
  }

  const qs = params.toString();
  const response = await apiRequest<{
    data: AdminOrderListItem[];
    total: number;
    page: number;
    limit: number;
  }>(`/admin/orders${qs ? `?${qs}` : ""}`);
  return { ...response, offset: (response.page - 1) * response.limit };
}

export async function apiGetAdminOrder(id: string): Promise<AdminOrderDetail> {
  return apiRequest(`/admin/orders/${id}`);
}

export async function apiAddAdminOrderNote(
  id: string,
  note: string
): Promise<{ success: boolean; note: AdminOrderNote }> {
  return apiRequest(`/admin/orders/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function apiReprocessOrderWebhook(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/admin/orders/${id}/reprocess-webhook`, {
    method: "POST",
  });
}

export async function apiReconcileOrderSettlement(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/admin/orders/${id}/reconcile-settlement`, {
    method: "POST",
  });
}

// ----------------------------------------------------
// Admin Products API
// ----------------------------------------------------
export interface AdminProductItem {
  id: string;
  name: string;
  description: string | null;
  retailPrice: number;
  supplierTotalCpa: number;
  affiliateNetPayout: number;
  platformFee: number;
  stock: number;
  reservedStock: number;
  status: "active" | "suspended" | "out_of_stock" | "archived";
  supplierId: string;
  supplierName?: string;
  activeOrdersCount?: number;
  deliveryRate?: number;
  rtoRate?: number;
  escrowCoverage?: number;
  createdAt: string;
}

export interface AdminProductQuery {
  status?: string;
  supplierId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function apiGetAdminProducts(
  query: AdminProductQuery = {}
): Promise<{ data: AdminProductItem[]; total: number; limit: number; offset: number }> {
  const params = new URLSearchParams();
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.supplierId) params.set("supplierId", query.supplierId);
  if (query.search) params.set("search", query.search);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) {
    params.set(
      "page",
      String(Math.floor(query.offset / (query.limit || 20)) + 1)
    );
  }

  const qs = params.toString();
  const response = await apiRequest<{
    data: AdminProductItem[];
    total: number;
    page: number;
    limit: number;
  }>(`/admin/products${qs ? `?${qs}` : ""}`);
  return { ...response, offset: (response.page - 1) * response.limit };
}

export async function apiGetAdminProduct(id: string): Promise<AdminProductItem> {
  return apiRequest(`/admin/products/${id}`);
}

export async function apiUpdateProductStatus(
  id: string,
  status: "active" | "suspended" | "archived",
  reason?: string
): Promise<AdminProductItem> {
  return apiRequest(`/admin/products/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
}

export async function apiGetProductPerformance(id: string): Promise<any> {
  return apiRequest(`/admin/products/${id}/performance`);
}

// ----------------------------------------------------
// Admin Reconciliation API
// ----------------------------------------------------
export interface ReconciliationSummary {
  walletsAudited: number;
  walletsWithVariance: number;
  totalVarianceAmount: number;
  deliveredOrdersAudited: number;
  ordersMissingSettlement: number;
  ordersWithDuplicateTransactions: number;
  lastRunAt: string | null;
}

export interface WalletDiscrepancy {
  walletId: string;
  ownerId: string;
  ownerType: string;
  cachedBalance: number;
  ledgerSum: number;
  variance: number;
}

export interface OrderDiscrepancy {
  orderId: string;
  orderStatus: string;
  trackingNumber: string | null;
  expectedCpa: number;
  supplierDebitSum: number;
  affiliatePayoutSum: number;
  platformFeeSum: number;
  issue: string;
}

export async function apiGetReconciliationSummary(): Promise<ReconciliationSummary> {
  const data = await apiRequest<{
    totalWalletsChecked: number;
    walletVariancesCount: number;
    totalVarianceAmount: number;
    totalOrdersChecked: number;
    orderAnomaliesCount: number;
    lastRun?: { createdAt?: string } | null;
  }>("/admin/reconciliation/summary");

  return {
    walletsAudited: data.totalWalletsChecked,
    walletsWithVariance: data.walletVariancesCount,
    totalVarianceAmount: data.totalVarianceAmount,
    deliveredOrdersAudited: data.totalOrdersChecked,
    ordersMissingSettlement: data.orderAnomaliesCount,
    ordersWithDuplicateTransactions: 0,
    lastRunAt: data.lastRun?.createdAt || null,
  };
}

export async function apiGetReconciliationWallets(): Promise<{
  discrepancies: WalletDiscrepancy[];
  total: number;
}> {
  const data = await apiRequest<WalletDiscrepancy[]>("/admin/reconciliation/wallets");
  return { discrepancies: data, total: data.length };
}

export async function apiGetReconciliationOrders(): Promise<{
  discrepancies: OrderDiscrepancy[];
  total: number;
}> {
  const data = await apiRequest<OrderDiscrepancy[]>("/admin/reconciliation/orders");
  return { discrepancies: data, total: data.length };
}

export async function apiRunReconciliation(): Promise<{
  success: boolean;
  run: any;
}> {
  const run = await apiRequest("/admin/reconciliation/runs", {
    method: "POST",
  });
  return { success: true, run };
}

export async function apiGetReconciliationRuns(): Promise<any[]> {
  return apiRequest("/admin/reconciliation/runs");
}

// ----------------------------------------------------
// Admin Webhooks API
// ----------------------------------------------------
export interface WebhookEventItem {
  id: string;
  provider: string;
  providerEventId: string | null;
  trackingNumber: string;
  receivedStatus: string;
  normalizedStatus: string;
  processingStatus: "PROCESSED" | "FAILED" | "IGNORED";
  errorMessage: string | null;
  rawPayload?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function apiGetWebhookEvents(limit = 50): Promise<WebhookEventItem[]> {
  return apiRequest(`/admin/webhooks?limit=${limit}`);
}

// ----------------------------------------------------
// Admin Agents Management API
// ----------------------------------------------------
export interface CallCenterAgentItem {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: "CALL_CENTER_AGENT";
  tenantId: string | null;
  isActive: boolean;
  createdAt: string;
  tenantName?: string;
}

export async function apiGetAgents(): Promise<CallCenterAgentItem[]> {
  return apiRequest<CallCenterAgentItem[]>("/admin/agents");
}

export async function apiCreateAgent(data: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  tenantId?: string;
}): Promise<CallCenterAgentItem> {
  return apiRequest<CallCenterAgentItem>("/admin/agents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiAssignAgentTenant(
  agentId: string,
  tenantId: string
): Promise<{ success: boolean; agentId: string; tenantId: string }> {
  return apiRequest(`/admin/agents/${agentId}/tenant`, {
    method: "PATCH",
    body: JSON.stringify({ tenantId }),
  });
}

export async function apiUpdateAgentStatus(
  agentId: string,
  isActive: boolean
): Promise<{ success: boolean; id: string; isActive: boolean }> {
  return apiRequest(`/admin/agents/${agentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

// ----------------------------------------------------
// Admin Audit Logs API
// ----------------------------------------------------
export interface AuditLogItem {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: any;
  afterState: any;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogQuery {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export async function apiGetAuditLogs(
  query: AuditLogQuery = {}
): Promise<{ data: AuditLogItem[]; total: number; limit: number; offset: number }> {
  const params = new URLSearchParams();
  if (query.action) params.set("action", query.action);
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.entityId) params.set("entityId", query.entityId);
  if (query.userId) params.set("userId", query.userId);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));

  const qs = params.toString();
  return apiRequest(`/admin/audit-logs${qs ? `?${qs}` : ""}`);
}
