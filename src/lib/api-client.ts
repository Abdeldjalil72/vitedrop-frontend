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

export interface ApiRequestOptions extends RequestInit {
  silentAuthFail?: boolean;
}

export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {}
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
    const isAuthRequest = path.startsWith("/auth/");
    if (response.status === 401 && !isAuthRequest && !options.silentAuthFail) {
      removeAuthToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        const returnUrl = window.location.pathname + window.location.search;
        const event = new CustomEvent("vitedrop:unauthorized", {
          cancelable: true,
          detail: { returnUrl },
        });
        const dispatched = window.dispatchEvent(event);
        if (dispatched) {
          const redirectParam = encodeURIComponent(returnUrl);
          window.location.assign(`/login?redirect=${redirectParam}`);
        }
      }
    }

    const message =
      data?.message ||
      (Array.isArray(data?.message) ? data.message.join(", ") : null) ||
      `Erreur serveur (${response.status})`;
    const err: any = new Error(Array.isArray(message) ? message.join(", ") : message);
    err.status = response.status;
    err.data = data;
    throw err;
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

export interface RegisterAffiliateInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  trafficSource?: string;
  experienceLevel?: string;
  wilaya?: number;
  telegramHandle?: string;
}

export interface RegisterSupplierInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  company?: string;
  warehouseWilaya?: number;
  warehouseCommune?: string;
  businessType?: string;
  callCenterPreference?: string;
  monthlyVolume?: string;
}

export interface RegisterResult {
  requiresVerification: boolean;
  email: string;
  message: string;
  access_token?: string;
  user?: DecodedToken | null;
}

export async function apiRegisterAffiliate(data: RegisterAffiliateInput): Promise<RegisterResult> {
  const res = await apiRequest<RegisterResult>(
    "/auth/register/affiliate",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (res?.access_token) {
    setAuthToken(res.access_token);
    const user = parseJwt(res.access_token);
    return { ...res, user };
  }

  return res;
}

export async function apiRegisterSupplier(data: RegisterSupplierInput): Promise<RegisterResult> {
  const res = await apiRequest<RegisterResult>(
    "/auth/register/supplier",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (res?.access_token) {
    setAuthToken(res.access_token);
    const user = parseJwt(res.access_token);
    return { ...res, user };
  }

  return res;
}

export async function apiVerifyEmail(data: {
  email: string;
  code: string;
}): Promise<{ success: boolean; access_token: string; user: DecodedToken | null; message: string }> {
  const res = await apiRequest<{ success: boolean; access_token: string; user?: any; message: string }>(
    "/auth/verify-email",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (res?.access_token) {
    setAuthToken(res.access_token);
    const user = parseJwt(res.access_token);
    return { success: true, access_token: res.access_token, user, message: res.message };
  }

  throw new Error("Échec de la validation du code.");
}

export async function apiResendVerification(
  email: string
): Promise<{ success: boolean; message: string; isAlreadyVerified?: boolean }> {
  return await apiRequest("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function apiForgotPassword(
  email: string
): Promise<{ success: boolean; message: string; debugToken?: string }> {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

// Wallet API Methods
export async function apiGetMyWallet(): Promise<{
  id: string;
  balance: number;
  ownerType: string;
}> {
  const data = await apiRequest<{ id: string; balance: string | number; ownerType: string }>("/wallets/me");
  if (data && data.balance !== undefined) {
    return {
      ...data,
      balance: Number(data.balance || 0),
    };
  }
  return data as any;
}

export async function apiGetTransactions(limit = 20, offset = 0) {
  const res = await apiRequest<{ data: any[]; total: number; limit: number; offset: number }>(
    `/wallets/transactions?limit=${limit}&offset=${offset}`
  );
  if (res?.data && Array.isArray(res.data)) {
    return {
      ...res,
      data: res.data.map((tx: any) => ({
        ...tx,
        amount: Number(tx.amount || 0),
        balanceAfter: Number(tx.balanceAfter || 0),
      })),
    };
  }
  return res;
}

export async function apiWithdrawWallet(
  amount: number,
  method: string,
  recipientDetails: string
): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
  const backendMethod =
    method === "BANK" ? "BANK_TRANSFER" : method === "USDT" ? "BARIDIMOB" : method;
  return apiRequest("/wallets/withdraw", {
    method: "POST",
    body: JSON.stringify({ amount, method: backendMethod, recipientDetails }),
  });
}

// User Payout Settings API
export interface PayoutSettings {
  payoutMethod: "BARIDIMOB" | "CCP" | "BANK_TRANSFER" | string;
  payoutRip: string;
  payoutCcpNumber: string;
  payoutCcpKey: string;
  payoutFullName: string;
}

export async function apiGetPayoutSettings(): Promise<PayoutSettings> {
  return apiRequest<PayoutSettings>("/users/payout-settings", { silentAuthFail: true });
}

export async function apiUpdatePayoutSettings(
  data: Partial<PayoutSettings>
): Promise<{ success: boolean; payoutMethod: string; payoutRip: string }> {
  return apiRequest("/users/payout-settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Telemetry & Affiliate Analytics API
export interface AffiliateAnalytics {
  totalClicks: number;
  totalLeads: number;
  totalDelivered: number;
  totalCanceled: number;
  inPipeline: number;
  totalEarnings: number;
  pendingEarnings: number;
  conversionRate: number;
  deliveryRate: number;
  epc: number;
}

export async function apiRecordClick(data: {
  productId: string;
  affiliateId: string;
  utmSource?: string;
  utmCampaign?: string;
  subId?: string;
}): Promise<{ recorded: boolean; deduplicated: boolean; clickId: string }> {
  return apiRequest("/tracking/click", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiGetAffiliateAnalytics(): Promise<AffiliateAnalytics> {
  return apiRequest<AffiliateAnalytics>("/affiliate/analytics", { silentAuthFail: true });
}

export function updateGlobalWalletBalance(balance: number): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("vitedrop_wallet_balance", String(balance));
    } catch { }
    window.dispatchEvent(new CustomEvent("vitedrop_balance_updated", { detail: balance }));
  }
}

export async function apiAdminTopUpSupplier(
  supplierId: string,
  amount: number,
  referenceId: string
): Promise<{ id: string; balance: number; ownerId: string; ownerType: string }> {
  const data = await apiRequest<{ id: string; balance: string | number; ownerId: string; ownerType: string }>(
    `/wallets/top-up/${supplierId}`,
    {
      method: "POST",
      body: JSON.stringify({ amount, referenceId }),
    }
  );
  return {
    ...data,
    balance: Number(data.balance || 0),
  };
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
  imageUrl?: string;
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
  utmSource?: string;
  utm_source?: string;
  utmCampaign?: string;
  utm_campaign?: string;
  subId?: string;
  sub_id?: string;
}

export async function apiCreateCheckoutLead(
  payload: CreateCheckoutPayload
): Promise<{ success: boolean; orderId: string }> {
  return apiRequest<{ success: boolean; orderId: string }>("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Public Order Tracking
export interface PublicOrderTimelineItem {
  status: string;
  date: string;
  reason?: string;
}

export interface PublicOrderTracking {
  id: string;
  reference: string;
  trackingNumber: string | null;
  courier: string | null;
  status: string;
  customerName: string;
  maskedPhone: string;
  wilaya: number;
  commune: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  returnReason?: string | null;
  returnNotes?: string | null;
  restockStatus?: string | null;
  canRequestReturn?: boolean;
  isReturnRequested?: boolean;
  createdAt: string;
  updatedAt: string;
  timeline: PublicOrderTimelineItem[];
}

export async function apiTrackOrder(reference: string): Promise<PublicOrderTracking> {
  return apiRequest<PublicOrderTracking>(`/orders/track/${encodeURIComponent(reference.trim())}`);
}

export async function apiCreateReturnRequest(dto: {
  reference?: string;
  orderId?: string;
  phone: string;
  reason: string;
  notes?: string;
}): Promise<{ success: boolean; orderId: string; message: string; returnReason: string }> {
  return apiRequest<{ success: boolean; orderId: string; message: string; returnReason: string }>(
    "/orders/return-request",
    {
      method: "POST",
      body: JSON.stringify({
        reference: dto.reference || dto.orderId,
        phone: dto.phone,
        reason: dto.reason,
        notes: dto.notes,
      }),
    }
  );
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
  courierLabelUrl?: string | null;
  cancellationReason?: string | null;
  returnReason?: string | null;
  returnNotes?: string | null;
  restockStatus?: string | null;
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

export async function apiDispatchSupplierOrder(
  orderId: string,
  data?: { trackingNumber?: string; courier?: string }
): Promise<SupplierOrder> {
  return apiRequest<SupplierOrder>(`/supplier/call-center/${orderId}/dispatch`, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiDispatchYalidine(orderId: string): Promise<SupplierOrder> {
  return apiRequest<SupplierOrder>(`/supplier/call-center/${orderId}/dispatch-yalidine`, {
    method: "POST",
  });
}

export async function apiRecordCallAttempt(
  orderId: string,
  attempt: number,
  reason?: string
): Promise<{ success: boolean; attempt: number; reason: string }> {
  return apiRequest<{ success: boolean; attempt: number; reason: string }>(
    `/supplier/call-center/${orderId}/call-attempt`,
    {
      method: "POST",
      body: JSON.stringify({ attempt, reason: reason || "Injoignable / Pas de réponse" }),
      silentAuthFail: true,
    }
  );
}

export async function apiRestockRtoOrder(
  orderId: string,
  condition: "INTACT" | "DAMAGED",
  notes?: string
): Promise<{
  success: boolean;
  orderId: string;
  status: string;
  restockStatus: string;
  stockRestored: boolean;
  quantity: number;
  currentProductStock: number | null;
  message?: string;
}> {
  return apiRequest(`/supplier/orders/${orderId}/rto-restock`, {
    method: "POST",
    body: JSON.stringify({ condition, notes }),
  });
}

export async function apiSimulateCourierWebhook(
  trackingNumber: string,
  status: "Livre" | "Retour",
  provider?: "yalidine" | "zr_express" | string
): Promise<any> {
  const isZr =
    provider?.toLowerCase().includes("zr") ||
    trackingNumber.trim().toUpperCase().startsWith("ZR");
  const endpoint = isZr
    ? "/webhooks/courier/zr-express"
    : "/webhooks/courier/yalidine";
  return apiRequest(endpoint, {
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
  return apiRequest("/admin/stats", { silentAuthFail: true });
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
  walletBalance?: number;
  reviewerName?: string | null;
  reviewerEmail?: string | null;
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
  updatedAt?: string;
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
  const res = await apiRequest<any>("/admin/withdrawals/pending");
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
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
  return apiRequest<AdminUser[]>("/admin/users", { silentAuthFail: true });
}

export async function apiUpdateUserStatus(
  id: string,
  isActive: boolean,
  reason?: string
): Promise<{ success: boolean; id: string; isActive: boolean }> {
  return apiRequest(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive, reason }),
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
  imageUrl?: string;
  stock: number;
  retailPrice: number;
  supplierTotalCpa: number;
}): Promise<any> {
  return apiRequest("/supplier/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateSupplierProduct(
  id: string,
  data: {
    name?: string;
    description?: string;
    imageUrl?: string;
    retailPrice?: number;
    supplierTotalCpa?: number;
    stockToAdd?: number;
    isActive?: boolean;
  },
): Promise<any> {
  return apiRequest(`/supplier/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiUploadImage(
  file: File,
): Promise<{ success: boolean; url: string; filename: string; size: number; mimetype: string }> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/uploads/image`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Échec du téléchargement de l'image");
  }
  return data;
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
  metadata?: Record<string, unknown> | null;
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
  try {
    return await apiRequest(`/admin/products/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    });
  } catch (err: unknown) {
    if (status === "archived") {
      return apiRequest(`/admin/products/${id}/archive`, {
        method: "PATCH",
      });
    } else if (status === "suspended") {
      return apiRequest(`/admin/products/${id}/suspend`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      });
    } else if (status === "active") {
      return apiRequest(`/admin/products/${id}/reactivate`, {
        method: "PATCH",
      });
    }
    throw err;
  }
}

export interface ProductPerformanceMetrics {
  totalOrders: number;
  deliveredOrders: number;
  rtoOrders: number;
  canceledOrders: number;
  activeOrders: number;
  deliveryRate: number;
  rtoRate: number;
}

export async function apiGetProductPerformance(
  id: string,
): Promise<ProductPerformanceMetrics> {
  return apiRequest<ProductPerformanceMetrics>(`/admin/products/${id}/performance`);
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

export interface ReconciliationRun {
  id: string;
  createdAt: string;
  walletsAudited: number;
  walletsWithVariance: number;
  ordersAudited?: number;
  ordersWithAnomalies?: number;
  totalVarianceAmount?: number;
  status?: "SUCCESS" | "FAILED" | "COMPLETED" | string;
  executedBy?: string | null;
}

export interface ReconciliationRunDetail extends ReconciliationRun {
  walletDiscrepancies?: WalletDiscrepancy[];
  orderDiscrepancies?: OrderDiscrepancy[];
  logs?: string[];
}

export async function apiGetReconciliationSummary(): Promise<ReconciliationSummary> {
  const data = await apiRequest<{
    totalWalletsChecked?: number;
    walletsAudited?: number;
    walletVariancesCount?: number;
    walletsWithVariance?: number;
    totalVarianceAmount?: number;
    totalOrdersChecked?: number;
    deliveredOrdersAudited?: number;
    orderAnomaliesCount?: number;
    ordersMissingSettlement?: number;
    ordersWithDuplicateTransactions?: number;
    lastRun?: { createdAt?: string } | null;
    lastRunAt?: string | null;
  }>("/admin/reconciliation/summary");

  return {
    walletsAudited: data.walletsAudited ?? data.totalWalletsChecked ?? 0,
    walletsWithVariance: data.walletsWithVariance ?? data.walletVariancesCount ?? 0,
    totalVarianceAmount: data.totalVarianceAmount ?? 0,
    deliveredOrdersAudited: data.deliveredOrdersAudited ?? data.totalOrdersChecked ?? 0,
    ordersMissingSettlement: data.ordersMissingSettlement ?? data.orderAnomaliesCount ?? 0,
    ordersWithDuplicateTransactions: data.ordersWithDuplicateTransactions ?? 0,
    lastRunAt: data.lastRunAt ?? data.lastRun?.createdAt ?? null,
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
  run: ReconciliationRun;
}> {
  const response = await apiRequest<ReconciliationRun | { run: ReconciliationRun; success?: boolean }>(
    "/admin/reconciliation/runs",
    { method: "POST" }
  );

  const run: ReconciliationRun =
    "run" in response && response.run ? response.run : (response as ReconciliationRun);

  return { success: true, run };
}

export async function apiGetReconciliationRuns(): Promise<ReconciliationRun[]> {
  const response = await apiRequest<ReconciliationRun[] | { data: ReconciliationRun[] }>(
    "/admin/reconciliation/runs"
  );
  if (Array.isArray(response)) {
    return response;
  }
  if (response && Array.isArray((response as { data: ReconciliationRun[] }).data)) {
    return (response as { data: ReconciliationRun[] }).data;
  }
  return [];
}

export async function apiGetReconciliationRunDetail(id: string): Promise<ReconciliationRunDetail> {
  return apiRequest<ReconciliationRunDetail>(`/admin/reconciliation/runs/${id}`);
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
  return apiRequest(`/admin/webhooks?limit=${limit}`, { silentAuthFail: true });
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
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
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
  return apiRequest(`/admin/audit-logs${qs ? `?${qs}` : ""}`, { silentAuthFail: true });
}

// ----------------------------------------------------
// Supplier Inbound Deposit Requests & Slips API
// ----------------------------------------------------
export type DepositRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DepositPaymentRail = "BARIDIMOB" | "CCP" | "BNA" | "CASH";

export interface DepositRequest {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  supplierPhone: string;
  amount: number;
  paymentRail: DepositPaymentRail;
  referenceNote: string | null;
  receiptUrl: string;
  status: DepositRequestStatus;
  rejectionReason: string | null;
  processedBy?: string | null;
  processedAt?: string | null;
  walletTransactionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepositRequestsResponse {
  data: DepositRequest[];
  total: number;
  pendingCount: number;
  limit: number;
  offset: number;
}

export async function apiSubmitDepositRequest(data: {
  amount: number;
  paymentRail: DepositPaymentRail | string;
  referenceNote?: string;
  receiptUrl: string;
}): Promise<DepositRequest> {
  return apiRequest("/wallets/deposit-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiGetMyDepositRequests(): Promise<DepositRequest[]> {
  return apiRequest("/wallets/deposit-requests/me", { silentAuthFail: true });
}

export async function apiGetAdminDepositRequests(query: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<DepositRequestsResponse> {
  const params = new URLSearchParams();
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));

  const qs = params.toString();
  return apiRequest(`/admin/deposit-requests${qs ? `?${qs}` : ""}`);
}

export async function apiApproveDepositRequest(
  id: string,
  verifiedAmount?: number,
  adminNote?: string
): Promise<{ success: boolean; newBalance: number; depositRequest: DepositRequest }> {
  return apiRequest(`/admin/deposit-requests/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ verifiedAmount, adminNote }),
  });
}

export async function apiRejectDepositRequest(
  id: string,
  reason: string
): Promise<{ success: boolean; depositRequest: DepositRequest }> {
  return apiRequest(`/admin/deposit-requests/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export interface SupplierSettings {
  storeName: string;
  phone: string;
  notificationEmail: string;
  warehouseWilaya: number;
  warehouseCommune: string;
  courierPreference: "YALIDINE" | "ZR_EXPRESS" | "NOEST" | "ECOTRACK" | "MAYSTRO" | "GUEPEX" | "AUTO";
  whatsappTemplate: string;
  enableCallCenterNotifications: boolean;
  enableStockAlerts: boolean;
}

const DEFAULT_SUPPLIER_SETTINGS: SupplierSettings = {
  storeName: "ViteDrop COD Partner",
  phone: "0550123456",
  notificationEmail: "supplier@vitedrop.com",
  warehouseWilaya: 16, // Alger
  warehouseCommune: "Bab Ezzouar",
  courierPreference: "AUTO",
  whatsappTemplate: "Bonjour {customer_name}, c'est le service confirmation pour votre commande de {product_name}. Confirmez-vous la livraison à {wilaya} ?",
  enableCallCenterNotifications: true,
  enableStockAlerts: true,
};

export async function apiGetSupplierSettings(): Promise<SupplierSettings> {
  try {
    return await apiRequest<SupplierSettings>("/supplier/settings", { silentAuthFail: true });
  } catch {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("vitedrop_supplier_settings");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // fallback to default
        }
      }
    }
    return { ...DEFAULT_SUPPLIER_SETTINGS };
  }
}

export async function apiUpdateSupplierSettings(
  settings: Partial<SupplierSettings>
): Promise<SupplierSettings> {
  if (typeof window !== "undefined") {
    const current = await apiGetSupplierSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem("vitedrop_supplier_settings", JSON.stringify(updated));
  }
  try {
    return await apiRequest<SupplierSettings>("/supplier/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  } catch {
    const current = await apiGetSupplierSettings();
    return { ...current, ...settings };
  }
}

export interface AdminPlatformSettings {
  platformFeePercent: number;
  highPriorityWithdrawalThreshold: number;
  minimumTopUpAmount: number;
  defaultShippingFee: number;
  rtoPenaltyAllowed: boolean;
  webhookReplayWindowSeconds: number;
  courierWebhookSecretConfigured: boolean;
}

const DEFAULT_ADMIN_SETTINGS: AdminPlatformSettings = {
  platformFeePercent: 20,
  highPriorityWithdrawalThreshold: 20000,
  minimumTopUpAmount: 5000,
  defaultShippingFee: 800,
  rtoPenaltyAllowed: false,
  webhookReplayWindowSeconds: 300,
  courierWebhookSecretConfigured: true,
};

export async function apiGetAdminPlatformSettings(): Promise<AdminPlatformSettings> {
  try {
    return await apiRequest<AdminPlatformSettings>("/admin/settings", { silentAuthFail: true });
  } catch {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("vitedrop_admin_platform_settings");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // fallback
        }
      }
    }
    return { ...DEFAULT_ADMIN_SETTINGS };
  }
}

export async function apiUpdateAdminPlatformSettings(
  settings: Partial<AdminPlatformSettings>
): Promise<AdminPlatformSettings> {
  if (typeof window !== "undefined") {
    const current = await apiGetAdminPlatformSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem("vitedrop_admin_platform_settings", JSON.stringify(updated));
  }
  try {
    return await apiRequest<AdminPlatformSettings>("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  } catch {
    const current = await apiGetAdminPlatformSettings();
    return { ...current, ...settings };
  }
}

// ==========================================
// Notifications API
// ==========================================

export type NotificationType =
  | "COMMISSION_EARNED"
  | "ORDER_DELIVERED"
  | "ORDER_RETURNED"
  | "WITHDRAWAL_APPROVED"
  | "WITHDRAWAL_PAID"
  | "WITHDRAWAL_REJECTED"
  | "ORDER_CREATED"
  | "DEPOSIT_APPROVED"
  | "DEPOSIT_REJECTED"
  | "STOCK_ALERT"
  | "ADMIN_NEW_WITHDRAWAL"
  | "ADMIN_NEW_DEPOSIT"
  | "SYSTEM_NOTICE";

export type NotificationCategory = "FINANCIAL" | "OPERATIONAL" | "STOCK" | "SYSTEM";

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  linkUrl?: string | null;
  data?: Record<string, any> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export async function apiGetNotifications(
  limit = 20,
  offset = 0,
  unreadOnly = false
): Promise<{ data: NotificationItem[]; total: number; unreadCount: number }> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (unreadOnly) params.set("unreadOnly", "true");
  return apiRequest(`/notifications?${params.toString()}`, { silentAuthFail: true });
}

export async function apiGetUnreadNotificationCount(): Promise<{ unreadCount: number }> {
  return apiRequest("/notifications/unread-count", { silentAuthFail: true });
}

export async function apiMarkNotificationRead(id: string): Promise<NotificationItem> {
  return apiRequest(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function apiMarkAllNotificationsRead(): Promise<{ success: boolean; updatedCount: number }> {
  return apiRequest("/notifications/mark-all-read", {
    method: "PATCH",
  });
}

export async function apiDeleteNotification(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/notifications/${id}`, {
    method: "DELETE",
  });
}


