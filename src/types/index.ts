// ViteDrop Core Types

export type UserRole = "affiliate" | "supplier" | "admin";

export type OrderStatus =
  | "lead_generated"
  | "canceled"
  | "supplier_confirmed"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "rto_in_transit"
  | "returned_to_supplier";

export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "CPA_PAYOUT"
  | "PLATFORM_FEE"
  | "SUPPLIER_DEBIT";

export type DeliveryType = "home" | "desk"; // à domicile vs stop-desk

export interface TrackingMetadata {
  click_id?: string;
  fbclid?: string;
  ttclid?: string;
  utm_source?: string;
  utm_campaign?: string;
  sub_id?: string;
}

export interface Product {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  supplierId: string;
  supplierName: string;
  retailPrice: number; // e.g. 4500 DZD
  totalCpaBudget: number; // e.g. 1000 DZD (Gross CPA set by supplier)
  affiliateNetPayout: number; // 80% = 800 DZD
  platformFee: number; // 20% = 200 DZD (hidden from affiliate)
  image: string;
  gallery: string[];
  stock: number;
  category: string;
  status: "active" | "draft" | "out_of_stock";
  createdAt: string;
}

export interface LeadOrder {
  id: string;
  trackingNumber?: string;
  productId: string;
  productTitle: string;
  affiliateId: string;
  affiliateName: string;
  supplierId: string;
  customerName: string;
  customerPhone: string;
  wilayaCode: string;
  wilayaName: string;
  commune: string;
  deliveryType: DeliveryType;
  deliveryFee: number;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  cancellationReason?: string;
  tracking: TrackingMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  userRole: UserRole;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  referenceId?: string; // lead id or withdrawal id
  description: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: "DZD";
  pendingPayouts?: number;
}
