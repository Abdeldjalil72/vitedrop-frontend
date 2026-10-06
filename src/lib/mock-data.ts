import { Product, LeadOrder, WalletTransaction, Wallet } from "@/types";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    title: "Tondeuse Professionnelle Sans Fil T9 Vintage",
    titleAr: "ماكينة حلاقة احترافية لاسلكية T9",
    description: "Tondeuse de finition avec lame en T en acier carbone ultra-précise. Batterie lithium 1200mAh longue durée.",
    supplierId: "supp-1",
    supplierName: "Atlas Electro Alger",
    retailPrice: 3800,
    totalCpaBudget: 1200,
    affiliateNetPayout: 960, // 80% of 1200
    platformFee: 240, // 20%
    image: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80"
    ],
    stock: 240,
    category: "Beauté & Soins",
    status: "active",
    createdAt: "2026-09-15T10:00:00Z",
  },
  {
    id: "prod-2",
    title: "Correcteur de Posture Dorsale Magnétique Ergonomique",
    titleAr: "حزام تصحيح استقامة الظهر المغناطيسي",
    description: "Soulage immédiatement les douleurs dorsales et lombaires. Ajustable pour toutes les tailles.",
    supplierId: "supp-2",
    supplierName: "Santé DZ Direct",
    retailPrice: 2900,
    totalCpaBudget: 1000,
    affiliateNetPayout: 800, // 80%
    platformFee: 200,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80"
    ],
    stock: 580,
    category: "Santé & Bien-être",
    status: "active",
    createdAt: "2026-09-20T14:30:00Z",
  },
  {
    id: "prod-3",
    title: "Mini Compresseur d'Air Sans Fil Rechargeable 150 PSI",
    titleAr: "مضخة هواء لاسلكية ذكية للسيارات والدراجات",
    description: "Arrêt automatique à pression désirée. Écran LCD numérique avec torche d'urgence LED.",
    supplierId: "supp-1",
    supplierName: "Atlas Electro Alger",
    retailPrice: 5900,
    totalCpaBudget: 1500,
    affiliateNetPayout: 1200, // 80%
    platformFee: 300,
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80"
    ],
    stock: 125,
    category: "Auto & Outillage",
    status: "active",
    createdAt: "2026-09-28T09:15:00Z",
  }
];

export const MOCK_LEADS: LeadOrder[] = [
  {
    id: "VD-89410",
    trackingNumber: "YAL-261001-9874",
    productId: "prod-1",
    productTitle: "Tondeuse Professionnelle Sans Fil T9 Vintage",
    affiliateId: "aff-101",
    affiliateName: "Karim Media Buyer",
    supplierId: "supp-1",
    customerName: "Mohamed Benali",
    customerPhone: "0550123456",
    wilayaCode: "16",
    wilayaName: "Alger",
    commune: "Bab El Oued",
    deliveryType: "home",
    deliveryFee: 450,
    quantity: 1,
    totalPrice: 4250,
    status: "delivered",
    tracking: {
      click_id: "clk_982348a",
      fbclid: "fb.1.1728000.abcde",
      utm_campaign: "fb_tondeuse_alger_broad"
    },
    createdAt: "2026-10-01T11:20:00Z",
    updatedAt: "2026-10-03T16:45:00Z",
  },
  {
    id: "VD-89411",
    trackingNumber: "YAL-261002-4512",
    productId: "prod-2",
    productTitle: "Correcteur de Posture Dorsale Magnétique Ergonomique",
    affiliateId: "aff-101",
    affiliateName: "Karim Media Buyer",
    supplierId: "supp-2",
    customerName: "Amina Khelifi",
    customerPhone: "0661987654",
    wilayaCode: "31",
    wilayaName: "Oran",
    commune: "Bir El Djir",
    deliveryType: "desk",
    deliveryFee: 350,
    quantity: 2,
    totalPrice: 6150,
    status: "in_transit",
    tracking: {
      click_id: "clk_772189b",
      ttclid: "tt_99182371a",
      utm_campaign: "tt_posture_lifestyle"
    },
    createdAt: "2026-10-02T09:10:00Z",
    updatedAt: "2026-10-03T10:15:00Z",
  },
  {
    id: "VD-89412",
    productId: "prod-3",
    productTitle: "Mini Compresseur d'Air Sans Fil Rechargeable 150 PSI",
    affiliateId: "aff-101",
    affiliateName: "Karim Media Buyer",
    supplierId: "supp-1",
    customerName: "Youcef Mansouri",
    customerPhone: "0770554433",
    wilayaCode: "25",
    wilayaName: "Constantine",
    commune: "El Khroub",
    deliveryType: "home",
    deliveryFee: 600,
    quantity: 1,
    totalPrice: 6500,
    status: "supplier_confirmed",
    tracking: {
      click_id: "clk_334512c",
      utm_campaign: "fb_compressor_drivers"
    },
    createdAt: "2026-10-03T14:05:00Z",
    updatedAt: "2026-10-03T15:30:00Z",
  },
  {
    id: "VD-89413",
    productId: "prod-1",
    productTitle: "Tondeuse Professionnelle Sans Fil T9 Vintage",
    affiliateId: "aff-101",
    affiliateName: "Karim Media Buyer",
    supplierId: "supp-1",
    customerName: "Sofiane Brahimi",
    customerPhone: "0560778899",
    wilayaCode: "09",
    wilayaName: "Blida",
    commune: "Boufarik",
    deliveryType: "home",
    deliveryFee: 500,
    quantity: 1,
    totalPrice: 4300,
    status: "lead_generated",
    tracking: {
      click_id: "clk_110982d"
    },
    createdAt: "2026-10-04T18:22:00Z",
    updatedAt: "2026-10-04T18:22:00Z",
  },
  {
    id: "VD-89414",
    trackingNumber: "ZR-8899201",
    productId: "prod-2",
    productTitle: "Correcteur de Posture Dorsale Magnétique Ergonomique",
    affiliateId: "aff-101",
    affiliateName: "Karim Media Buyer",
    supplierId: "supp-2",
    customerName: "Rachid Belkacem",
    customerPhone: "0670112233",
    wilayaCode: "19",
    wilayaName: "Sétif",
    commune: "El Eulma",
    deliveryType: "home",
    deliveryFee: 650,
    quantity: 1,
    totalPrice: 3550,
    status: "rto_in_transit",
    tracking: {
      click_id: "clk_554421e"
    },
    createdAt: "2026-09-29T10:00:00Z",
    updatedAt: "2026-10-03T09:00:00Z",
  },
  {
    id: "VD-89415",
    productId: "prod-1",
    productTitle: "Tondeuse Professionnelle Sans Fil T9 Vintage",
    affiliateId: "aff-101",
    affiliateName: "Karim Media Buyer",
    supplierId: "supp-1",
    customerName: "Anis Merad",
    customerPhone: "0540998877",
    wilayaCode: "16",
    wilayaName: "Alger",
    commune: "Kouba",
    deliveryType: "home",
    deliveryFee: 450,
    quantity: 1,
    totalPrice: 4250,
    status: "canceled",
    cancellationReason: "Fake Number / Client Unreachable (3 calls)",
    tracking: {
      click_id: "clk_667788f"
    },
    createdAt: "2026-10-02T13:40:00Z",
    updatedAt: "2026-10-02T17:10:00Z",
  }
];

export const MOCK_AFFILIATE_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "tx-101",
    walletId: "wal-aff-101",
    userId: "aff-101",
    userRole: "affiliate",
    type: "CPA_PAYOUT",
    amount: 960,
    balanceAfter: 48500,
    referenceId: "VD-89410",
    description: "CPA Net Payout for Order VD-89410 (Tondeuse T9)",
    createdAt: "2026-10-03T16:45:00Z",
  },
  {
    id: "tx-100",
    walletId: "wal-aff-101",
    userId: "aff-101",
    userRole: "affiliate",
    type: "WITHDRAWAL",
    amount: -30000,
    balanceAfter: 47540,
    referenceId: "wd-501",
    description: "Virement CCP Algerie Poste - Reçu #7712",
    createdAt: "2026-09-28T11:00:00Z",
  },
  {
    id: "tx-99",
    walletId: "wal-aff-101",
    userId: "aff-101",
    userRole: "affiliate",
    type: "CPA_PAYOUT",
    amount: 800,
    balanceAfter: 77540,
    referenceId: "VD-88120",
    description: "CPA Net Payout for Order VD-88120 (Correcteur Posture)",
    createdAt: "2026-09-27T15:20:00Z",
  }
];

export const MOCK_AFFILIATE_WALLET: Wallet = {
  id: "wal-aff-101",
  userId: "aff-101",
  balance: 48500,
  currency: "DZD",
  pendingPayouts: 2000, // in_transit orders potential net payout
};

export const MOCK_SUPPLIER_WALLET: Wallet = {
  id: "wal-supp-1",
  userId: "supp-1",
  balance: 142000, // Prepaid Escrow balance
  currency: "DZD",
};

// Data Layer functions
export async function getProducts(): Promise<Product[]> {
  return [...MOCK_PRODUCTS];
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

export async function getLeads(): Promise<LeadOrder[]> {
  return [...MOCK_LEADS];
}

export async function getTransactions(): Promise<WalletTransaction[]> {
  return [...MOCK_AFFILIATE_TRANSACTIONS];
}

export async function getWallet(): Promise<Wallet> {
  return { ...MOCK_AFFILIATE_WALLET };
}
