export type Language = "en" | "fr" | "ar";

export function isRTL(lang: Language): boolean {
  return lang === "ar";
}

export const translations = {
  en: {
    brand: "ViteDrop",
    tagline: "Algerian COD CPA Affiliate Network",
    roles: {
      affiliate: "Affiliate (Media Buyer)",
      supplier: "Supplier (Fournisseur)",
      admin: "Admin",
    },
    nav: {
      marketplace: "Marketplace",
      leads: "Leads & Orders",
      links: "Tracking Links",
      wallet: "Wallet & Payouts",
      settings: "Settings",
      supplierDashboard: "Supplier Queue",
      supplierProducts: "My Products",
      supplierOrders: "Waybill & Shipping",
      adminOverview: "Platform Escrow",
      adminWithdrawals: "Withdrawals Queue",
      adminDepositRequests: "Supplier Deposits",
      adminOrders: "Order Supervision",
      adminProducts: "Products Supervision",
      adminReconciliation: "Escrow Reconciliation",
      adminWebhooks: "Courier Webhooks",
      adminAgents: "Call Center Agents",
      adminUsers: "User Management",
      adminAuditLog: "System Audit Log",
      supplierSettings: "Store Settings",
      adminSettings: "Platform Settings",
    },
    statuses: {
      lead_generated: "Lead Generated",
      canceled: "Canceled",
      supplier_confirmed: "Confirmed (Call Center)",
      dispatched: "Dispatched",
      in_transit: "In Transit",
      delivered: "Delivered",
      rto_in_transit: "RTO in Transit",
      returned_to_supplier: "Returned to Supplier",
    },
    transactions: {
      DEPOSIT: "Top-up / Deposit",
      WITHDRAWAL: "Withdrawal",
      WITHDRAWAL_REFUND: "Withdrawal Refund",
      CPA_PAYOUT: "CPA Payout",
      PLATFORM_FEE: "Platform Fee (20%)",
      SUPPLIER_DEBIT: "Supplier CPA Debit",
    },
    common: {
      search: "Search...",
      filter: "Filter",
      export: "Export",
      actions: "Actions",
      status: "Status",
      date: "Date",
      amount: "Amount",
      balance: "Balance",
      copy: "Copy",
      copied: "Copied!",
      save: "Save Changes",
      cancel: "Cancel",
      confirm: "Confirm",
      loading: "Loading...",
      empty: "No records found",
      error: "An error occurred",
      retry: "Retry",
      details: "Details",
      viewAll: "View All",
      homeDelivery: "Home Delivery",
      deskDelivery: "Stop-Desk (Hub Pickup)",
      dzd: "DZD",
      logout: "Log out",
    },
    dashboard: {
      title: "Affiliate Performance Overview",
      welcome: "Welcome back, Karim! Here is your live COD traffic metrics.",
      stats: {
        totalEarnings: "Total Net Earnings",
        deliveredOrders: "Delivered Leads",
        pendingLeads: "In Transit / Confirmed",
        deliveryRate: "Delivery Rate (Taux de Livraison)",
        rtoRate: "RTO Rate",
      },
      recentLeads: "Recent Leads Stream",
      leadId: "Order ID",
      product: "Product",
      customer: "Customer & Wilaya",
      payout: "Net Payout",
      tracking: "Tracking Info",
      time: "Time",
    },
    auth: {
      loginTitle: "Sign in to ViteDrop",
      loginSubtitle: "Access your Algerian COD CPA performance portal",
      registerTitle: "Create your account",
      registerSubtitle: "Join the leading Algerian Cash-on-Delivery network",
      forgotTitle: "Reset password",
      forgotSubtitle: "Enter your registered email to receive recovery instructions",
      email: "Email address",
      password: "Password",
      fullName: "Full name",
      phone: "Algerian phone number",
      company: "Company / Store name",
      wilaya: "Operating Wilaya",
      roleSelect: "Account type",
      affiliateRole: "Media Buyer (Affiliate)",
      supplierRole: "Fournisseur (Supplier)",
      rememberMe: "Remember this device",
      forgotPasswordLink: "Forgot password?",
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: "Already have an account?",
      loginBtn: "Sign in to portal",
      registerBtn: "Create account & Start",
      sendResetBtn: "Send recovery link",
      backToLogin: "Back to login",
      phoneHint: "Must be a valid Algerian number (05, 06, 07)",
      loginSuccess: "Authentication successful! Redirecting...",
      registerSuccess: "Account created successfully! Redirecting...",
      resetSuccess: "Reset link dispatched to your inbox.",
    },
    marketplace: {
      title: "COD Winning Products Catalog",
      subtitle: "High-converting physical products with guaranteed warehouse stock across 58 wilayas",
      searchPlaceholder: "Search products by title or keyword...",
      allCategories: "All Categories",
      sortBy: "Sort by",
      sortHighestCpa: "Highest Net CPA",
      sortLowestPrice: "Lowest Retail Price",
      sortHighestPrice: "Highest Retail Price",
      sortNewest: "Newest Arrivals",
      retailPrice: "Retail Price",
      netPayout: "Your Net CPA",
      inStock: "Units in Stock",
      outOfStock: "Out of Stock",
      generateLink: "Generate Tracking Link",
      viewDetails: "View Product",
      productDetails: "Product Details & Angles",
      shippingRates: "Courier Delivery Rates (58 Wilayas)",
      marketingAngles: "Recommended Angles & Hook Ideas",
      linkModalTitle: "Generate Affiliate Tracking Link",
      linkModalDesc: "Attach your tracking parameters to attribute doorstep delivery payouts to your ad account.",
      campaignName: "Campaign Name (utm_campaign)",
      subId: "Sub-ID / Ad Set (sub_id)",
      generatedUrl: "Your Tracking URL",
      copyLink: "Copy Link",
      copiedToast: "Tracking link copied to clipboard!",
      backToCatalog: "Back to Catalog",
    },
    reconciliation: {
      header: {
        eyebrow: "Double-Entry Ledger Audit",
        title: "Financial Escrow Reconciliation",
        description: "Cryptographic and mathematical audit between cached wallet balances and immutable ledger entries across 58 wilayas.",
      },
      actions: {
        refresh: "Refresh Data",
        refreshing: "Refreshing...",
        runAudit: "Run Audit Cycle",
        runningAudit: "Auditing...",
        confirmRunTitle: "Initiate Reconciliation Cycle?",
        confirmRunDesc: "This will audit all system wallets, calculate variance against immutable transaction ledgers, and check delivered order settlement entries.",
        confirmRunBtn: "Execute Audit",
        cancelBtn: "Cancel",
      },
      posture: {
        allBalanced: "All Ledgers Balanced (0 Variance)",
        anomaliesDetected: "Anomalies Require Review",
        lastAuditPrefix: "Last run",
        neverAudited: "Never executed",
      },
      summary: {
        walletsAudited: "Wallets Audited",
        walletsAllClean: "100% Balanced with zero variance",
        walletsVarianceCount: "{count} with balance variance",
        totalVariance: "Total Accounting Variance",
        varianceDesc: "Difference between cached balance & ledger sum",
        deliveredOrders: "Delivered Orders Audited",
        ordersAllSettled: "All deliveries settled in ledger",
        ordersMissingSettlementCount: "{count} missing settlement entries",
        lastAuditRun: "Last Automated Audit",
        auditTripartite: "Tripartite mathematical integrity check",
      },
      tabs: {
        wallets: "Wallet Variances",
        orders: "Order Settlement Anomalies",
        history: "Audit Run History",
      },
      wallets: {
        title: "Wallet Balance Variances",
        countLabel: "records",
        colWalletId: "Wallet ID",
        colOwner: "Owner / Role",
        colCachedBalance: "Cached Balance",
        colLedgerSum: "Ledger Sum",
        colVariance: "Variance (Delta)",
        colStatus: "Integrity Status",
        statusClean: "Balanced (0 Variance)",
        statusVariance: "Variance Detected",
        emptyTitle: "Perfect Ledger Integrity",
        emptyDesc: "All wallet balances match their underlying immutable double-entry ledger transactions.",
      },
      orders: {
        title: "Delivered Order Settlement Anomalies",
        countLabel: "anomalies",
        colOrderId: "Order ID",
        colStatusTracking: "Status & Tracking",
        colExpectedCpa: "Expected CPA",
        colDebitVsPayout: "Supplier Debit vs Payout",
        colIssue: "Detected Issue",
        colAction: "Resolution Action",
        btnInspect: "Inspect Order",
        emptyTitle: "No Order Settlement Anomalies",
        emptyDesc: "All delivered COD orders have their corresponding supplier debits, affiliate payouts, and platform fees recorded.",
      },
      history: {
        title: "Previous Reconciliation Audit Runs",
        colRunId: "Run ID",
        colDate: "Execution Date",
        colWalletsAudited: "Wallets Checked",
        colVariances: "Variances Found",
        colResult: "Audit Verdict",
        resultClean: "BALANCED",
        resultAnomalies: "DISCREPANCIES",
        emptyTitle: "No Previous Audit Runs",
        emptyDesc: "Execute your first reconciliation cycle to generate an immutable audit report.",
      },
      messages: {
        runSuccess: "Reconciliation cycle executed successfully.",
        runError: "Failed to execute reconciliation audit cycle.",
        loadError: "Failed to load reconciliation data.",
        historyLoadError: "Could not fetch audit history records.",
      },
    },
    supplier: {
      dashboard: {
        hubBadge: "Supplier Hub • Call Center Desk",
        leadsWaitingSuffix: "leads waiting for call",
        title: "Order Queue & Confirmation",
        subtitle: "Confirm customer orders by phone, generate Yalidine waybills, and track deliveries",
        refresh: "Refresh",
        rechargeEscrow: "Top-up Escrow Balance",
        close: "Close",
        escrowBannerTitle: "ViteDrop Prepaid Escrow Model",
        statusLowBalance: "Low Balance",
        statusOperational: "Operational",
        escrowBannerDesc: "Your balance guarantees affiliate CPA payouts. Debits occur only upon carrier-confirmed delivery. 0 DZD charged on cancellations or returns.",
        availableBalance: "Available Balance",
        details: "Details",
        tabQueue: "Call Center Queue",
        tabConfirmed: "To Dispatch (Waybills)",
        tabAll: "All Orders & Tracking",
        queueTitle: "Direct Confirmation Queue",
        prospectsWaitingSuffix: "leads waiting",
        emptyQueueTitle: "Call queue is currently empty",
        emptyQueueDesc: "All incoming affiliate orders have been successfully confirmed by your team.",
        cancel: "Cancel",
        confirm: "Confirm",
        confirmOrder: "Confirm Order",
        colLeadRef: "Lead Ref.",
        colCustomerPhone: "Customer & Phone",
        colDestinationAddress: "Destination & Address",
        colQuantityTotal: "Quantity & Total",
        colStatus: "Status",
        colActions: "Call Center Actions",
        piece: "item(s)",
        confirmedTitle: "Confirmed Orders Ready for Dispatch",
        confirmedSubtitle: "Generate waybills and hand parcels over to Yalidine or ZR Express",
        readySuffix: "ready",
        emptyConfirmed: "No confirmed orders waiting for dispatch. Confirm leads in the Call Center tab.",
        colOrderRef: "Order Ref.",
        colClient: "Customer",
        colDestination: "Destination",
        colAddress: "Full Address",
        colAction: "Action",
        generateWaybill: "Generate Yalidine Waybill",
        allOrdersTitle: "Order History & Carrier Tracking",
        allOrdersSubtitle: "Full control and delivery tracking via Yalidine and ZR Express with webhook simulator",
        emptyAllOrders: "No orders recorded.",
        colClientDestination: "Customer & Destination",
        colCourierTracking: "Carrier & Tracking",
        colTotalCpaCost: "Total CPA Cost",
        colWebhookSimulator: "Webhook Simulator",
        simulateDelivered: "Simulate Delivered",
        simulateReturn: "Simulate Return",
        debitedAndDelivered: "Debited & Delivered",
        waitingForCall: "Waiting for call",
        notGenerated: "Not generated",
        msgLeadConfirmed: "Lead confirmed successfully. Ready for dispatch.",
        msgLeadCancelled: "Lead canceled successfully.",
        msgDispatched: "Yalidine waybill generated and order dispatched.",
        msgWebhookDelivered: "Simulated delivery notification successfully for {tracking}.",
        msgWebhookReturn: "Simulated return notification for {tracking}.",
        whatsAppTooltip: "Quick WhatsApp Ping",
        whatsAppMsgTemplate: "Hello {name}, this is ViteDrop regarding your order for {product}. Do you confirm delivery to {wilaya}?",
        callAttemptsLabel: "Calls",
        markAttemptBtn: "Unanswered",
        strikeBadge: "{count}/3 calls",
        strikeMaxAlert: "3 failed calls - cancellation recommended",
        solvencyRunwayText: "Est. runway: ~{count} CPA deliveries covered",
        hotkeyTip: "Hotkeys: [C] Confirm • [X] Cancel • [R] Refresh",
        operatorHotkeysTitle: "Call Center Hotkeys",
        batchSelectedCount: "{count} leads selected",
        batchTotalCpa: "Total CPA:",
        batchConfirmBtn: "Confirm Selection ({count})",
        batchConfirmSuccess: "{count} leads confirmed successfully!",
        batchCallAttemptBtn: "+1 Call Unanswered",
        batchCallAttemptSuccess: "Call attempt logged for {count} leads.",
        batchDeselectBtn: "Deselect",
        focusModeToggle: "Speed-Dial Mode",
        focusLeadProgress: "Lead {current} of {total}",
        focusConfirmNext: "Confirm & Next",
        focusNext: "Next",
        focusPrev: "Previous",
        focusClose: "Exit Speed-Dial",
        selectAllLeads: "Select All",
      },
      orders: {
        logisticsBadge: "Logistics & Shipping",
        title: "Waybill & Shipping",
        subtitle: "Issue waybills for delivery carriers (Yalidine / ZR Express) and track parcels",
        refresh: "Refresh",
        searchPlaceholder: "Search by order ID, customer, phone, or tracking...",
        allWilayas: "All wilayas (58)",
        tabAll: "All",
        tabToDispatch: "To Dispatch",
        tabDispatched: "Waybill Generated",
        tabInTransit: "In Transit",
        tabDelivered: "Delivered",
        tabRto: "RTO Returns",
        colOrderRef: "Order Ref.",
        colRecipient: "Recipient",
        colWaybillTracking: "Waybill / Tracking",
        colStatus: "Status",
        colCpaCost: "CPA Cost",
        colActions: "Actions",
        waitingWaybill: "Awaiting waybill",
        waybillYalidine: "Yalidine Waybill",
        simulateDelivered: "Simulate Delivered",
        simulateDeliveredMobile: "Simulate Delivery",
        deliveredSettled: "Delivered & Settled",
        copy: "Copy",
        copyTrackingTitle: "Copy tracking",
        emptyOrders: "No matching packages found.",
        msgDispatched: "Yalidine waybill generated successfully. Parcel in transit.",
        msgWebhookDelivered: "Delivery webhook simulated successfully ({status}).",
      },
      products: {
        catalogBadge: "Supplier Catalog • Solvency",
        activeProductsSuffix: "active products",
        title: "Catalog & Product Management",
        subtitle: "Set CPA budgets, manage inventory, and monitor escrow coverage",
        refresh: "Refresh",
        recharge: "Top-up",
        addProduct: "Add a Product",
        close: "Close",
        searchPlaceholder: "Search by name or ref...",
        filterAll: "All",
        filterActive: "Active",
        filterOutOfStock: "Out of Stock",
        emptySearch: "No matching products found",
        emptyCatalog: "No products found in your catalog",
        stockLow: "Low Stock",
        statusActive: "Active",
        stock: "Stock",
        price: "Price",
        grossCpa: "Gross CPA",
        netAffiliate: "Affiliate Net (80%):",
        colProductRef: "Product & Ref.",
        colStockCurrent: "Current Stock",
        colRetailPrice: "Retail Price",
        colBudgetGrossCpa: "Gross CPA Budget",
        colNetAffiliate: "Net Affiliate",
        colStatus: "Status",
        colPerformance: "Performance & RTO",
        deliveryRate: "Delivery Rate",
        rtoRate: "RTO Rate",
        healthOptimal: "High Success",
        healthStandard: "Normal Rate",
        healthWarning: "RTO Caution",
        simulatorTitle: "Profitability & Break-Even Simulator",
        simulatorSubtitle: "Simulate real net margin taking into account Algerian delivery success rates",
        costPriceLabel: "Unit Product Cost",
        costPricePlaceholder: "Ex: 1800",
        estDeliveryRateLabel: "Estimated Delivery Rate (%)",
        deliveryFeeLabel: "Average Delivery Fee",
        netMarginPerOrder: "Estimated Net Margin / Order:",
        breakEvenThreshold: "Break-Even Delivery Rate:",
        breakEvenSafe: "Healthy Margin",
        breakEvenCaution: "Sensitive to Return Rates",
        breakEvenLoss: "Warning: Risk of Loss",
        units: "units",
        msgCreated: "Product created and activated successfully in the catalog.",
      },
      wallet: {
        escrowBadge: "Escrow Account & Treasury",
        movementsSuffix: "movements",
        title: "Wallet & General Ledger",
        subtitle: "Manage your prepaid reserve and full audit trail of deposits and debits",
        refresh: "Refresh",
        recharge: "Top-up My Balance",
        cardBalanceTitle: "Current Escrow Balance",
        lowBalanceWarning: "Warning: balance below minimum buffer (3,000 DZD)",
        sufficientBalance: "Sufficient coverage for current shipments",
        cardDepositsTitle: "Total Prepaid Deposits",
        cardDepositsDesc: "Funds credited via BaridiMob & CCP transfers",
        cardDebitsTitle: "Confirmed Delivery Debits",
        cardDebitsDesc: "0 DZD fees on return (RTO)",
        searchPlaceholder: "Search by ref. or description...",
        filterAll: "All",
        filterDeposits: "Deposits",
        filterDebits: "Debits",
        emptyFiltered: "No financial movements matching filter",
        emptyLedger: "No financial movements recorded in this range.",
        depositCredit: "Deposit (Credit)",
        depositCreditTable: "Deposit (Credit)",
        debitDelivery: "Delivery Debit",
        debitDeliveryTable: "Delivery Debit",
        refRecharge: "Escrow Top-up",
        refDeliveryCpa: "Delivery CPA Commission",
        colTxRef: "Transaction Ref.",
        colType: "Type",
        colDetails: "Description / Details",
        colDateTime: "Date & Time",
        colAmount: "Amount",
        exportCsvBtn: "Export CSV",
        exportSuccess: "CSV statement downloaded successfully.",
        timeframeAll: "All Time",
        timeframeToday: "Today",
        timeframeLast7Days: "Last 7 Days",
        timeframeThisMonth: "This Month",
        gaugeTitle: "Predictive Solvency & Runway Telemetry",
        gaugeSubtitle: "Real-time analysis of in-transit delivery commitments and escrow coverage",
        solvencyAvailableBalance: "Available Escrow Reserve",
        inTransitLiabilityTitle: "Committed CPA in Transit",
        inTransitLiabilityDesc: "Pending escrow commitment for orders currently handled by Yalidine",
        netFreeMarginTitle: "Net Free Safety Margin",
        netFreeMarginDesc: "Uncommitted reserve available for new product activations",
        parcelsOnTheRoad: "parcels on the road",
        runwayDeliveriesCount: "~{count} deliveries covered",
        runwayOptimal: "Optimal Reserve (Safe >8 Deliveries)",
        runwayWarning: "Attention: Top-Up Recommended Before Weekend",
        runwayCritical: "Critical Solvency: Recharging Required",
        recommendedTopupTitle: "Velocity-Based Top-up Recommendation",
        recommendedTopupDesc: "At current shipping pace, depositing ~{amount} ensures 7 days of unhindered affiliate ads.",
        quickPresetsTitle: "Quick Top-up Presets:",
        copiedAmount: "Amount copied!",
      },
    },
  },
  fr: {
    brand: "ViteDrop",
    tagline: "Réseau d'Affiliation COD CPA en Algérie",
    roles: {
      affiliate: "Affilié (Media Buyer)",
      supplier: "Fournisseur",
      admin: "Administrateur",
    },
    nav: {
      marketplace: "Catalogue Produits",
      leads: "Commandes & Leads",
      links: "Liens de Tracking",
      wallet: "Portefeuille & Retraits",
      settings: "Paramètres",
      supplierDashboard: "File d'attente",
      supplierProducts: "Mes Produits",
      supplierOrders: "Bordereaux & Expéditions",
      adminOverview: "Supervision & Escrow",
      adminWithdrawals: "Retraits CCP / BaridiMob",
      adminDepositRequests: "Dépôts Fournisseurs",
      adminOrders: "Supervision Commandes",
      adminProducts: "Supervision Produits",
      adminReconciliation: "Réconciliation Escrow",
      adminWebhooks: "Webhooks Transporteurs",
      adminAgents: "Agents Call Center",
      adminUsers: "Gestion Utilisateurs",
      adminAuditLog: "Journal d'Audit",
      supplierSettings: "Paramètres Boutique",
      adminSettings: "Paramètres Plateforme",
    },
    statuses: {
      lead_generated: "Lead Généré",
      canceled: "Annulé",
      supplier_confirmed: "Confirmé (Centre d'Appel)",
      dispatched: "Expédié (Bordereau créé)",
      in_transit: "En Acheminement",
      delivered: "Livré (Encaissé)",
      rto_in_transit: "Retour en cours (RTO)",
      returned_to_supplier: "Retour Réceptionné",
    },
    transactions: {
      DEPOSIT: "Recharge / Dépôt",
      WITHDRAWAL: "Retrait CCP/Banque",
      WITHDRAWAL_REFUND: "Remboursement Retrait",
      CPA_PAYOUT: "Commission CPA Nette",
      PLATFORM_FEE: "Frais Plateforme (20%)",
      SUPPLIER_DEBIT: "Débit CPA Fournisseur",
    },
    common: {
      search: "Rechercher...",
      filter: "Filtrer",
      export: "Exporter",
      actions: "Actions",
      status: "Statut",
      date: "Date",
      amount: "Montant",
      balance: "Solde",
      copy: "Copier",
      copied: "Copié !",
      save: "Enregistrer",
      cancel: "Annuler",
      confirm: "Confirmer",
      loading: "Chargement...",
      empty: "Aucune donnée disponible",
      error: "Une erreur est survenue",
      retry: "Réessayer",
      details: "Détails",
      viewAll: "Voir tout",
      homeDelivery: "À Domicile",
      deskDelivery: "Stop-Desk (Bureau Yalidine/ZR)",
      dzd: "DZD",
      logout: "Déconnexion",
    },
    dashboard: {
      title: "Tableau de Bord Affilié",
      welcome: "Ravi de vous revoir, Karim ! Voici l'état en direct de vos conversions COD.",
      stats: {
        totalEarnings: "Gains Nets Cumulés",
        deliveredOrders: "Commandes Livrées",
        pendingLeads: "En Cours / Acheminement",
        deliveryRate: "Taux de Livraison",
        rtoRate: "Taux de Retour (RTO)",
      },
      recentLeads: "Flux des Dernières Commandes",
      leadId: "N° Commande",
      product: "Produit",
      customer: "Client & Wilaya",
      payout: "CPA Net",
      tracking: "Tracking / UTM",
      time: "Date",
    },
    auth: {
      loginTitle: "Connexion à ViteDrop",
      loginSubtitle: "Accédez à votre espace d'affiliation COD en Algérie",
      registerTitle: "Créer un compte",
      registerSubtitle: "Rejoignez le premier réseau d'affiliation Cash-on-Delivery en Algérie",
      forgotTitle: "Mot de passe oublié",
      forgotSubtitle: "Entrez votre email pour recevoir les instructions de réinitialisation",
      email: "Adresse e-mail",
      password: "Mot de passe",
      fullName: "Nom et prénom",
      phone: "Numéro de téléphone DZ",
      company: "Nom de l'entreprise / Marque",
      wilaya: "Wilaya principale",
      roleSelect: "Vous êtes :",
      affiliateRole: "Media Buyer (Affilié)",
      supplierRole: "Fournisseur (Propriétaire de stock)",
      rememberMe: "Se souvenir de moi",
      forgotPasswordLink: "Mot de passe oublié ?",
      dontHaveAccount: "Pas encore de compte ?",
      alreadyHaveAccount: "Vous avez déjà un compte ?",
      loginBtn: "Se connecter au portail",
      registerBtn: "Créer mon compte",
      sendResetBtn: "Envoyer le lien de récupération",
      backToLogin: "Retour à la connexion",
      phoneHint: "Numéro algérien valide requis (05, 06 ou 07)",
      loginSuccess: "Connexion réussie ! Redirection...",
      registerSuccess: "Compte créé avec succès ! Redirection...",
      resetSuccess: "Lien de réinitialisation envoyé à votre adresse e-mail.",
    },
    marketplace: {
      title: "Catalogue Produits Gagnants COD",
      subtitle: "Produits physiques à forte conversion avec stock garanti en entrepôt et livraison 58 Wilayas",
      searchPlaceholder: "Rechercher un produit par nom, mot-clé...",
      allCategories: "Toutes les catégories",
      sortBy: "Trier par",
      sortHighestCpa: "CPA Net le plus élevé",
      sortLowestPrice: "Prix de vente croissant",
      sortHighestPrice: "Prix de vente décroissant",
      sortNewest: "Nouveautés",
      retailPrice: "Prix de Vente",
      netPayout: "Votre CPA Net",
      inStock: "Unités en stock",
      outOfStock: "En rupture",
      generateLink: "Générer le lien",
      viewDetails: "Voir la fiche",
      productDetails: "Fiche Produit & Angles Marketing",
      shippingRates: "Tarifs de Livraison Transporteur (58 Wilayas)",
      marketingAngles: "Angles Publicitaires & Hooks Conseillés",
      linkModalTitle: "Générer un Lien de Tracking Affilié",
      linkModalDesc: "Attachez vos paramètres pour tracker vos conversions Meta / TikTok Ads sans perte d'attribution.",
      campaignName: "Nom de la campagne (utm_campaign)",
      subId: "Identifiant Sub-ID / Set (sub_id)",
      generatedUrl: "Votre lien de tracking prêt à l'emploi",
      copyLink: "Copier le lien",
      copiedToast: "Lien copié dans le presse-papier !",
      backToCatalog: "Retour au catalogue",
    },
    reconciliation: {
      header: {
        eyebrow: "Audit Comptable Double-Entrée",
        title: "Réconciliation Financière Escrow",
        description: "Contrôle d'intégrité comptable : variance de solde et complétude des écritures tripartites sur les 58 wilayas.",
      },
      actions: {
        refresh: "Actualiser",
        refreshing: "Actualisation...",
        runAudit: "Lancer un Cycle d'Audit",
        runningAudit: "Audit en cours...",
        confirmRunTitle: "Lancer le Cycle de Réconciliation ?",
        confirmRunDesc: "Cette action vérifie tous les portefeuilles, compare les soldes au grand livre d'écritures et audite les commissions des commandes livrées.",
        confirmRunBtn: "Exécuter l'Audit",
        cancelBtn: "Annuler",
      },
      posture: {
        allBalanced: "Grand livre 100% équilibré (0 variance)",
        anomaliesDetected: "Anomalies détectées requérant révision",
        lastAuditPrefix: "Dernier audit",
        neverAudited: "Jamais exécuté",
      },
      summary: {
        walletsAudited: "Portefeuilles Audités",
        walletsAllClean: "100% Intègres sans aucun écart",
        walletsVarianceCount: "{count} avec écarts de solde",
        totalVariance: "Écart Total (Variance)",
        varianceDesc: "Différence solde en cache vs somme du grand livre",
        deliveredOrders: "Commandes Livrées Audités",
        ordersAllSettled: "Toutes les livraisons sont régularisées",
        ordersMissingSettlementCount: "{count} sans écritures comptables",
        lastAuditRun: "Dernier Audit Automatisé",
        auditTripartite: "Contrôle d'intégrité tripartite",
      },
      tabs: {
        wallets: "Écarts Portefeuilles",
        orders: "Anomalies Commandes",
        history: "Historique des Runs",
      },
      wallets: {
        title: "Écarts de Portefeuille (Variance)",
        countLabel: "résultat(s)",
        colWalletId: "Portefeuille",
        colOwner: "Propriétaire / Rôle",
        colCachedBalance: "Solde Portefeuille",
        colLedgerSum: "Somme Grand Livre",
        colVariance: "Écart (Variance)",
        colStatus: "Statut d'Intégrité",
        statusClean: "Équilibré (0 Variance)",
        statusVariance: "Anomalie Détectée",
        emptyTitle: "Intégrité comptable parfaite",
        emptyDesc: "Tous les soldes en cache correspondent rigoureusement à la somme de leurs écritures comptables.",
      },
      orders: {
        title: "Anomalies de Règlement des Commandes Livrées",
        countLabel: "anomalie(s)",
        colOrderId: "Commande",
        colStatusTracking: "Statut & Suivi",
        colExpectedCpa: "CPA Prévu",
        colDebitVsPayout: "Débit vs Payout",
        colIssue: "Problème Détecté",
        colAction: "Action",
        btnInspect: "Inspecter",
        emptyTitle: "Aucune anomalie de commande",
        emptyDesc: "Toutes les commandes livrées disposent de leurs écritures de débit fournisseur, gain affilié et frais de plateforme.",
      },
      history: {
        title: "Historique des Cycles d'Audit",
        colRunId: "Identifiant",
        colDate: "Date d'Exécution",
        colWalletsAudited: "Portefeuilles Vérifiés",
        colVariances: "Écarts Constatés",
        colResult: "Verdict d'Audit",
        resultClean: "CONFORME",
        resultAnomalies: "DISCORDANCES",
        emptyTitle: "Aucun historique disponible",
        emptyDesc: "Lancez un cycle de réconciliation pour consigner votre premier rapport d'audit.",
      },
      messages: {
        runSuccess: "Cycle de réconciliation exécuté avec succès.",
        runError: "Échec de l'exécution du cycle de réconciliation.",
        loadError: "Erreur lors du chargement des données de réconciliation.",
        historyLoadError: "Impossible de charger l'historique des cycles d'audit.",
      },
    },
    supplier: {
      dashboard: {
        hubBadge: "Fournisseur Hub • Call Center Desk",
        leadsWaitingSuffix: "leads en attente d'appel",
        title: "File d'attente & Confirmation",
        subtitle: "Confirmez les commandes par téléphone, générez les bordereaux Yalidine et suivez les livraisons",
        refresh: "Actualiser",
        rechargeEscrow: "Recharger le Solde Escrow",
        close: "Fermer",
        escrowBannerTitle: "Modèle Escrow Prépayé ViteDrop",
        statusLowBalance: "Solde Bas",
        statusOperational: "Opérationnel",
        escrowBannerDesc: "Votre solde garantit les commissions CPA des affiliés. Le débit intervient uniquement au moment de la livraison confirmée par le transporteur. 0 DZD débité en cas de retour.",
        availableBalance: "Solde Actuel",
        details: "Détails",
        tabQueue: "File d'appel Call Center",
        tabConfirmed: "À Expédier (Bordereaux)",
        tabAll: "Toutes les Commandes",
        queueTitle: "File d'attente des leads à contacter",
        prospectsWaitingSuffix: "prospects en attente",
        emptyQueueTitle: "Aucun lead en attente d'appel",
        emptyQueueDesc: "Toutes les commandes ont été traitées par votre équipe call center.",
        cancel: "Annuler",
        confirm: "Confirmer",
        confirmOrder: "Confirmer",
        colLeadRef: "Réf. Lead",
        colCustomerPhone: "Client & Téléphone",
        colDestinationAddress: "Destination & Adresse",
        colQuantityTotal: "Quantité & Total",
        colStatus: "Statut",
        colActions: "Actions Call Center",
        piece: "pièce(s)",
        confirmedTitle: "Commandes confirmées à expédier",
        confirmedSubtitle: "Générez les bordereaux de livraison et confiez les colis au transporteur",
        readySuffix: "prêtes",
        emptyConfirmed: "Aucune commande en attente d'expédition. Confirmez les leads dans l'onglet Call Center.",
        colOrderRef: "Réf. Commande",
        colClient: "Client",
        colDestination: "Destination",
        colAddress: "Adresse",
        colAction: "Action",
        generateWaybill: "Générer Bordereau & Expédier",
        allOrdersTitle: "Historique & Suivi Transporteur",
        allOrdersSubtitle: "Suivez les livraisons en temps réel ou simulez les webhooks pour tester la comptabilité",
        emptyAllOrders: "Aucune commande enregistrée.",
        colClientDestination: "Client & Destination",
        colCourierTracking: "Transporteur & Tracking",
        colTotalCpaCost: "Coût CPA Total",
        colWebhookSimulator: "Simulateur Webhook",
        simulateDelivered: "Simuler Livré",
        simulateReturn: "Simuler Retour",
        debitedAndDelivered: "Débité & Livré",
        waitingForCall: "En attente d'appel",
        notGenerated: "Non généré",
        msgLeadConfirmed: "Lead confirmé avec succès. Prêt pour expédition.",
        msgLeadCancelled: "Lead annulé avec succès.",
        msgDispatched: "Bordereau Yalidine généré et commande expédiée.",
        msgWebhookDelivered: "Notification de livraison simulée avec succès pour {tracking}.",
        msgWebhookReturn: "Notification de retour simulée pour {tracking}.",
        whatsAppTooltip: "Relance rapide WhatsApp",
        whatsAppMsgTemplate: "Bonjour {name}, nous vous contactons concernant votre commande de {product} sur ViteDrop. Confirmez-vous la livraison à {wilaya} ?",
        callAttemptsLabel: "Appels",
        markAttemptBtn: "Injoignable",
        strikeBadge: "{count}/3 appels",
        strikeMaxAlert: "3 appels sans réponse - annulation recommandée",
        solvencyRunwayText: "Couverture estimée : ~{count} livraisons CPA couvertes",
        hotkeyTip: "Raccourcis : [C] Confirmer • [X] Annuler • [R] Actualiser",
        operatorHotkeysTitle: "Raccourcis Call Center",
        batchSelectedCount: "{count} leads sélectionnés",
        batchTotalCpa: "Total CPA :",
        batchConfirmBtn: "Confirmer la sélection ({count})",
        batchConfirmSuccess: "{count} leads confirmés avec succès !",
        batchCallAttemptBtn: "+1 Appel non répondu",
        batchCallAttemptSuccess: "Tentative d'appel enregistrée pour {count} leads.",
        batchDeselectBtn: "Désélectionner",
        focusModeToggle: "Mode Speed-Dial",
        focusLeadProgress: "Lead {current} sur {total}",
        focusConfirmNext: "Confirmer & Suivant",
        focusNext: "Suivant",
        focusPrev: "Précédent",
        focusClose: "Quitter Speed-Dial",
        selectAllLeads: "Tout sélectionner",
      },
      orders: {
        logisticsBadge: "Logistique & Expéditions",
        title: "Bordereaux & Expéditions",
        subtitle: "Édition des bordereaux de transport Yalidine / ZR Express et suivi des colis",
        refresh: "Actualiser",
        searchPlaceholder: "Rechercher par N° commande, client, téléphone ou tracking...",
        allWilayas: "Toutes les wilayas (58)",
        tabAll: "Tous",
        tabToDispatch: "À Expédier",
        tabDispatched: "Bordereau Généré",
        tabInTransit: "En Transit",
        tabDelivered: "Livrés",
        tabRto: "Retours RTO",
        colOrderRef: "Réf. Commande",
        colRecipient: "Destinataire",
        colWaybillTracking: "Bordereau / Tracking",
        colStatus: "Statut",
        colCpaCost: "Coût CPA",
        colActions: "Actions",
        waitingWaybill: "En attente de bordereau",
        waybillYalidine: "Bordereau Yalidine",
        simulateDelivered: "Simuler Livré",
        simulateDeliveredMobile: "Simuler Livré",
        deliveredSettled: "Livré & Soldé",
        copy: "Copier",
        copyTrackingTitle: "Copier le tracking",
        emptyOrders: "Aucun colis trouvé.",
        msgDispatched: "Bordereau Yalidine généré avec succès. Colis en transit.",
        msgWebhookDelivered: "Webhook de livraison simulé avec succès ({status}).",
      },
      products: {
        catalogBadge: "Catalogue Fournisseur • Solvabilité",
        activeProductsSuffix: "produits actifs",
        title: "Catalogue & Gestion des Produits",
        subtitle: "Définissez les budgets CPA, gérez vos stocks et contrôlez la couverture de votre séquestre",
        refresh: "Actualiser",
        recharge: "Recharger",
        addProduct: "Ajouter un Produit",
        close: "Fermer",
        searchPlaceholder: "Rechercher par nom ou réf...",
        filterAll: "Tous",
        filterActive: "Actifs",
        filterOutOfStock: "Épuisés",
        emptySearch: "Aucun produit correspondant",
        emptyCatalog: "Aucun produit trouvé dans votre catalogue",
        stockLow: "Stock Faible",
        statusActive: "Actif",
        stock: "Stock",
        price: "Prix",
        grossCpa: "CPA Brut",
        netAffiliate: "Net Affilié (80%) :",
        colProductRef: "Produit & Réf.",
        colStockCurrent: "Stock Actuel",
        colRetailPrice: "Prix de Vente",
        colBudgetGrossCpa: "Budget CPA Brut",
        colNetAffiliate: "Net Affilié",
        colStatus: "Statut",
        colPerformance: "Performance & RTO",
        deliveryRate: "Taux de Livraison",
        rtoRate: "Taux de Retour (RTO)",
        healthOptimal: "Excellente Réussite",
        healthStandard: "Moyenne Normale",
        healthWarning: "Vigilance RTO",
        simulatorTitle: "Simulateur de Rentabilité & Seuil RTO",
        simulatorSubtitle: "Calcul prédictif de votre marge nette réelle (Taux de livraison moyen Algérie 70%)",
        costPriceLabel: "Coût Unitaire Produit (Achat/Stock)",
        costPricePlaceholder: "Ex: 1800",
        estDeliveryRateLabel: "Taux de Livraison Estimé (%)",
        deliveryFeeLabel: "Frais de Livraison Moyens",
        netMarginPerOrder: "Marge Nette Estimée / Commande :",
        breakEvenThreshold: "Seuil de Rentabilité (Break-Even) :",
        breakEvenSafe: "Rentabilité Saine",
        breakEvenCaution: "Marge Sensible aux Retours",
        breakEvenLoss: "Attention : Risque de Perte",
        units: "unités",
        msgCreated: "Produit créé et activé avec succès dans le catalogue.",
      },
      wallet: {
        escrowBadge: "Compte Escrow & Trésorerie",
        movementsSuffix: "mouvements",
        title: "Portefeuille & Grand Livre",
        subtitle: "Gestion de votre réserve prépayée et traçabilité intégrale de vos dépôts et prélèvements",
        refresh: "Actualiser",
        recharge: "Recharger mon Solde",
        cardBalanceTitle: "Solde Escrow Actuel",
        lowBalanceWarning: "Attention: solde inférieur au tampon minimum (3 000 DZD)",
        sufficientBalance: "Couverture suffisante pour les expéditions",
        cardDepositsTitle: "Total Dépôts Prépayés",
        cardDepositsDesc: "Fonds crédités via BaridiMob & virements CCP",
        cardDebitsTitle: "Débits Livraisons Confirmées",
        cardDebitsDesc: "0 DZD de frais en cas de retour (RTO)",
        searchPlaceholder: "Rechercher par réf. ou libellé...",
        filterAll: "Tous",
        filterDeposits: "Dépôts",
        filterDebits: "Prélèvements",
        emptyFiltered: "Aucun mouvement financier correspondant",
        emptyLedger: "Aucun mouvement financier enregistré.",
        depositCredit: "Dépôt (Crédit)",
        depositCreditTable: "Dépôt (Crédit)",
        debitDelivery: "Débit Livraison",
        debitDeliveryTable: "Débit Livraison",
        refRecharge: "Rechargement Escrow",
        refDeliveryCpa: "Commission CPA Livraison",
        colTxRef: "Réf. Mouvement",
        colType: "Type",
        colDetails: "Libellé / Détails",
        colDateTime: "Date & Heure",
        colAmount: "Montant",
        exportCsvBtn: "Exporter CSV",
        exportSuccess: "Relevé de compte CSV téléchargé avec succès.",
        timeframeAll: "Tout l'historique",
        timeframeToday: "Aujourd'hui",
        timeframeLast7Days: "7 derniers jours",
        timeframeThisMonth: "Ce mois-ci",
        gaugeTitle: "Solvabilité Prédictive & Jauge de Couverture",
        gaugeSubtitle: "Analyse en temps réel de vos engagements en transit et de votre réserve séquestre",
        solvencyAvailableBalance: "Solde Disponible en Compte",
        inTransitLiabilityTitle: "CPA Engagé en Transit",
        inTransitLiabilityDesc: "Montant réservé pour les colis actuellement pris en charge par Yalidine",
        netFreeMarginTitle: "Marge Nette Libre de Sécurité",
        netFreeMarginDesc: "Réserve non engagée immédiatement disponible pour lancer de nouveaux produits",
        parcelsOnTheRoad: "colis en cours de livraison",
        runwayDeliveriesCount: "~{count} livraisons couvertes",
        runwayOptimal: "Réserve Optimale (Sécurité >8 livraisons)",
        runwayWarning: "Vigilance : Rechargement Conseillé Avant le Week-End",
        runwayCritical: "Solvabilité Critique : Rechargement Immédiat Requis",
        recommendedTopupTitle: "Recommandation de Rechargement par Vélocité",
        recommendedTopupDesc: "Au rythme actuel, un versement de ~{amount} garantit 7 jours d'activité sans risque de coupure.",
        quickPresetsTitle: "Montants suggérés :",
        copiedAmount: "Montant copié !",
      },
    },
  },
  ar: {
    brand: "فايت دروب",
    tagline: "شبكة الأفلييت والدفع عند الاستلام الأولى في الجزائر",
    roles: {
      affiliate: "مسوق (ميديا باير)",
      supplier: "مورّد (صاحب السلعة)",
      admin: "المسؤول العام",
    },
    nav: {
      marketplace: "سوق المنتجات",
      leads: "الطلبات والمبيعات",
      links: "روابط التتبع",
      wallet: "المحفظة والأرباح",
      settings: "الإعدادات",
      supplierDashboard: "مركز الاتصال والتأكيد",
      supplierProducts: "منتجاتي",
      supplierOrders: "بوالص الشحن والإرسال",
      adminOverview: "الرقابة المالية والحجز",
      adminWithdrawals: "سحوبات بريد الجزائر",
      adminDepositRequests: "إيداعات الموردين",
      adminOrders: "إدارة ومراقبة الطلبات",
      adminProducts: "إدارة ومراقبة المنتجات",
      adminReconciliation: "المطابقة والتسوية المالية",
      adminWebhooks: "إشعارات شركات التوصيل",
      adminAgents: "وكلاء مركز الاتصال",
      adminUsers: "إدارة المستخدمين",
      adminAuditLog: "سجل العمليات والرقابة",
      supplierSettings: "إعدادات المتجر",
      adminSettings: "إعدادات المنصة",
    },
    statuses: {
      lead_generated: "طلب مسجل (جديد)",
      canceled: "ملغي (مركز الاتصال)",
      supplier_confirmed: "مؤكد هاتفياً",
      dispatched: "تم تجهيز البوليصة",
      in_transit: "قيد التوصيل (مع شركة الشحن)",
      delivered: "تم التسليم وتحصيل المبلغ",
      rto_in_transit: "طرد راجع قيد الإرجاع",
      returned_to_supplier: "مسترجع للمخزن",
    },
    transactions: {
      DEPOSIT: "إيداع رصيد بالمحفظة",
      WITHDRAWAL: "سحب أرباح (بريد الجزائر CCP)",
      WITHDRAWAL_REFUND: "استرجاع مبلغ سحب",
      CPA_PAYOUT: "عمولة أفلييت صافية",
      PLATFORM_FEE: "عمولة المنصة (20%)",
      SUPPLIER_DEBIT: "خصم تكلفة التسليم من المورد",
    },
    common: {
      search: "بحث...",
      filter: "تصفية",
      export: "تصدير",
      actions: "إجراءات",
      status: "الحالة",
      date: "التاريخ",
      amount: "المبلغ",
      balance: "الرصيد",
      copy: "نسخ",
      copied: "تم النسخ!",
      save: "حفظ التغييرات",
      cancel: "إلغاء",
      confirm: "تأكيد",
      loading: "جاري التحميل...",
      empty: "لا توجد بيانات حالياً",
      error: "حدث خطأ غير متوقع",
      retry: "إعادة المحاولة",
      details: "التفاصيل",
      viewAll: "عرض الكل",
      homeDelivery: "توصيل للمنزل",
      deskDelivery: "استلام من مكتب التوصيل",
      dzd: "د.ج",
      logout: "تسجيل الخروج",
    },
    dashboard: {
      title: "لوحة تحكم المسوق",
      welcome: "مرحباً بك مجدداً، كريم! إليك ملخص أداء حملاتك الإعلانية والأرباح الحية.",
      stats: {
        totalEarnings: "صافي الأرباح المحصلة",
        deliveredOrders: "الطلبات المسلمة بنجاح",
        pendingLeads: "قيد التوصيل / مؤكدة",
        deliveryRate: "نسبة التوصيل (Taux de Livraison)",
        rtoRate: "نسبة الراجِع (RTO)",
      },
      recentLeads: "أحدث تدفقات الطلبات",
      leadId: "رقم الطلب",
      product: "المنتج",
      customer: "الزبون والولاية",
      payout: "العمولة الصافية",
      tracking: "بيانات الإعلان والتتبع",
      time: "الوقت",
    },
    auth: {
      loginTitle: "تسجيل الدخول إلى فايت دروب",
      loginSubtitle: "ادخل إلى بوابتك لمتابعة أداء حملات الدفع عند الاستلام",
      registerTitle: "إنشاء حساب جديد",
      registerSubtitle: "انضم إلى أقوى شبكة أفلييت COD في الـ 58 ولاية جزائرية",
      forgotTitle: "استعادة كلمة المرور",
      forgotSubtitle: "أدخل بريدك الإلكتروني المسجل لاستلام رابط إعادة التعيين",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      fullName: "الاسم الكامل",
      phone: "رقم الهاتف الجزائري",
      company: "اسم الشركة أو المتجر",
      wilaya: "الولاية الرئيسية",
      roleSelect: "نوع الحساب",
      affiliateRole: "مسوق (Media Buyer)",
      supplierRole: "مورّد (صاحب السلعة)",
      rememberMe: "تذكر هذا الجهاز",
      forgotPasswordLink: "نسيت كلمة المرور؟",
      dontHaveAccount: "ليس لديك حساب بعد؟",
      alreadyHaveAccount: "هل لديك حساب بالفعل؟",
      loginBtn: "دخول إلى لوحة التحكم",
      registerBtn: "إنشاء الحساب وبدء العمل",
      sendResetBtn: "إرسال رابط الاستعادة",
      backToLogin: "العودة لتسجيل الدخول",
      phoneHint: "يجب إدخال رقم جزائري صالح (05، 06، أو 07)",
      loginSuccess: "تم تسجيل الدخول بنجاح! جاري التوجيه...",
      registerSuccess: "تم إنشاء الحساب بنجاح! جاري التوجيه...",
      resetSuccess: "تم إرسال رابط الاستعادة إلى بريدك الإلكتروني.",
    },
    marketplace: {
      title: "سوق المنتجات الرابحة COD",
      subtitle: "منتجات استهلاكية ذات معدل تحويل عالي مع مخزون حقيقي وشحن لكافة الـ 58 ولاية",
      searchPlaceholder: "ابحث باسم المنتج أو الكلمة المفتاحية...",
      allCategories: "جميع الأصناف",
      sortBy: "ترتيب حسب",
      sortHighestCpa: "أعلى عمولة صافية (CPA)",
      sortLowestPrice: "الأقل سعراً للزبون",
      sortHighestPrice: "الأعلى سعراً للزبون",
      sortNewest: "أحدث المنتجات المضافة",
      retailPrice: "سعر البيع",
      netPayout: "عمولتك الصافية",
      inStock: "قطعة متوفرة بالمخزن",
      outOfStock: "نفذت الكمية",
      generateLink: "إنشاء رابط الإعلان",
      viewDetails: "معاينة المنتج",
      productDetails: "تفاصيل المنتج وزوايا التسويق",
      shippingRates: "أسعار الشحن الرسمية (58 ولاية)",
      marketingAngles: "زوايا إعلانية مقترحة للميديا باير",
      linkModalTitle: "إنشاء رابط تتبع للحملة الإعلانية",
      linkModalDesc: "اربط رابط الحملة بمعرفات التتبع لتحصيل عمولتك تلقائياً عند تسليم الطلب.",
      campaignName: "اسم الحملة (utm_campaign)",
      subId: "المعرف الفرعي / الإعلان (sub_id)",
      generatedUrl: "رابط التتبع الجاهز للنشر",
      copyLink: "نسخ الرابط",
      copiedToast: "تم نسخ الرابط إلى الحافظة بنجاح!",
      backToCatalog: "العودة للمتجر",
    },
    reconciliation: {
      header: {
        eyebrow: "المطابقة والتدقيق المحاسبي المزدوج",
        title: "مطابقة القيود وسلامة الحسابات المالية",
        description: "التأكد من التوازن المحاسبي بين رصيد المحافظ وسجل المعاملات، ورصد أي شذوذ في التسويات عبر 58 ولاية.",
      },
      actions: {
        refresh: "تحديث البيانات",
        refreshing: "جاري التحديث...",
        runAudit: "تشغيل دورة تدقيق",
        runningAudit: "جاري التدقيق...",
        confirmRunTitle: "بدء دورة تدقيق محاسبي جديدة؟",
        confirmRunDesc: "ستقوم هذه العملية بمراجعة جميع محافظ النظام ومقارنة الأرصدة مع سجل القيود والتحقق من تسويات عمولات التوصيل.",
        confirmRunBtn: "بدء التدقيق الآن",
        cancelBtn: "إلغاء",
      },
      posture: {
        allBalanced: "سجل الحسابات متطابق 100% (صفر فارق)",
        anomaliesDetected: "توجد فروقات تتطلب مراجعة فورية",
        lastAuditPrefix: "آخر تدقيق",
        neverAudited: "لم ينفذ بعد",
      },
      summary: {
        walletsAudited: "المحافظ المراجعة",
        walletsAllClean: "متطابقة 100% بدون أي فارق",
        walletsVarianceCount: "{count} محفظة بفوارق حسابية",
        totalVariance: "إجمالي الفارق المحاسبي",
        varianceDesc: "مقارنة رصيد المحفظة مع مجموع قيود السجل",
        deliveredOrders: "طلبيات تم تسليمها مدققة",
        ordersAllSettled: "جميع الطلبيات المسلمة تمت تسويتها",
        ordersMissingSettlementCount: "{count} طلبية بدون قيود تسوية",
        lastAuditRun: "آخر تدقيق آلي",
        auditTripartite: "تدقيق رياضي ثلاثي الأطراف",
      },
      tabs: {
        wallets: "فروقات المحافظ",
        orders: "شذوذ تسوية الطلبيات",
        history: "سجل دورات التدقيق",
      },
      wallets: {
        title: "فروقات المحافظ المالية (Variance)",
        countLabel: "حالة مسجلة",
        colWalletId: "المحفظة",
        colOwner: "صاحب الحساب / الدور",
        colCachedBalance: "الرصيد المقيد",
        colLedgerSum: "مجموع سجل المعاملات",
        colVariance: "الفارق المحاسبي",
        colStatus: "حالة التوازن",
        statusClean: "متطابق 100%",
        statusVariance: "فارق محاسبي",
        emptyTitle: "جميع المحافظ متطابقة تماماً مع سجل القيود",
        emptyDesc: "كل أرصدة المستخدمين متطابقة رياضياً مع مجموع قيود القيد المزدوج المقيدة في النظام.",
      },
      orders: {
        title: "شذوذ تسوية الطلبيات المسلمة",
        countLabel: "شذوذ مرصود",
        colOrderId: "رقم الطلبية",
        colStatusTracking: "الحالة ورقم التتبع",
        colExpectedCpa: "العمولة المتوقعة (CPA)",
        colDebitVsPayout: "خصم المورد مقابل دفع المسوق",
        colIssue: "المشكلة المرصودة",
        colAction: "الإجراء",
        btnInspect: "فحص وتسوية",
        emptyTitle: "لا توجد أي شذوذ في تسويات الطلبيات",
        emptyDesc: "جميع الطلبيات المسلمة مكتملة القيود المالية (خصم المورد، عمولة المسوق، ورسوم المنصة).",
      },
      history: {
        title: "سجل دورات التدقيق السابقة",
        colRunId: "معرف الدورة",
        colDate: "تاريخ التنفيذ",
        colWalletsAudited: "المحافظ المفحوصة",
        colVariances: "الفروقات المرصودة",
        colResult: "نتيجة التدقيق",
        resultClean: "متطابق",
        resultAnomalies: "توجد فروقات",
        emptyTitle: "لا توجد دورات تدقيق سابقة مسجلة",
        emptyDesc: "قم بتشغيل أول دورة تدقيق لإنشاء تقرير فحص محاسبي موثق.",
      },
      messages: {
        runSuccess: "تم تنفيذ دورة التدقيق المحاسبي بنجاح.",
        runError: "فشل تنفيذ دورة التدقيق المحاسبي.",
        loadError: "خطأ أثناء تحميل بيانات المطابقة المالية.",
        historyLoadError: "تعذر تحميل سجل دورات التدقيق السابقة.",
      },
    },
    supplier: {
      dashboard: {
        hubBadge: "مركز اتصالات وتأكيد الطلبات",
        leadsWaitingSuffix: "طلبات بانتظار الاتصال",
        title: "إدارة الطلبات والشحن",
        subtitle: "تأكيد الطلبات هاتفياً مع الزبائن، إنشاء بوالص الشحن لـ Yalidine، ومتابعة التحصيل",
        refresh: "تحديث",
        rechargeEscrow: "شحن رصيد الضمان",
        close: "إغلاق",
        escrowBannerTitle: "نظام الضمان المالي المسبق (Escrow Ledger)",
        statusLowBalance: "رصيد منخفض",
        statusOperational: "جاهز للتشغيل",
        escrowBannerDesc: "رصيدك الحالي يضمن تغطية عمولات CPA للمسوقين بعد نجاح التسليم الفعلي فقط. في حال إلغاء الطلب أو إرجاعه (RTO)، لا يتم خصم أي عمولة منصة أو مسوق.",
        availableBalance: "الرصيد المتاح",
        details: "تفاصيل",
        tabQueue: "طلبات بانتظار الاتصال",
        tabConfirmed: "بانتظار بوليصة الشحن",
        tabAll: "جميع الطلبات والتتبع",
        queueTitle: "قائمة الاتصال والتأكيد المباشر",
        prospectsWaitingSuffix: "طلب يتطلب اتصالاً",
        emptyQueueTitle: "قائمة الاتصال فارغة حالياً",
        emptyQueueDesc: "تم تأكيد جميع الطلبات الواردة من المسوقين بنجاح.",
        cancel: "إلغاء",
        confirm: "تأكيد",
        confirmOrder: "تأكيد الطلب",
        colLeadRef: "رقم الطلب",
        colCustomerPhone: "بيانات الزبون",
        colDestinationAddress: "العنوان والولاية",
        colQuantityTotal: "الكمية والمبلغ",
        colStatus: "الحالة",
        colActions: "إجراءات التأكيد",
        piece: "قطعة",
        confirmedTitle: "الطلبات المؤكدة الجاهزة للشحن",
        confirmedSubtitle: "أنشئ بوالص الشحن واربطها مباشرة مع Yalidine و ZR Express",
        readySuffix: "جاهزة",
        emptyConfirmed: "لا توجد طلبات مؤكدة بانتظار الشحن حالياً.",
        colOrderRef: "رقم الطلب",
        colClient: "العميل",
        colDestination: "الوجهة",
        colAddress: "العنوان الكامل",
        colAction: "الإجراء",
        generateWaybill: "إنشاء بوليصة Yalidine",
        allOrdersTitle: "سجل جميع الطلبات وتتبع شركات الشحن",
        allOrdersSubtitle: "تحكم كامل وتتبع بوالص الشحن عبر Yalidine و ZR Express مع محاكي الويب هوك",
        emptyAllOrders: "لا توجد طلبات مسجلة.",
        colClientDestination: "العميل والوجهة",
        colCourierTracking: "شركة التوصيل ورقم التتبع",
        colTotalCpaCost: "التكلفة الإجمالية",
        colWebhookSimulator: "محاكي الويب هوك",
        simulateDelivered: "محاكاة تسليم ناجح",
        simulateReturn: "محاكاة إرجاع",
        debitedAndDelivered: "تم التحصيل والخصم",
        waitingForCall: "في انتظار الاتصال",
        notGenerated: "غير مولد",
        msgLeadConfirmed: "تم تأكيد الطلب بنجاح. جاهز للشحن.",
        msgLeadCancelled: "تم إلغاء الطلب بنجاح.",
        msgDispatched: "تم إنشاء بوليصة Yalidine وإرسال الطلب.",
        msgWebhookDelivered: "تمت محاكاة إشعار التسليم بنجاح لـ {tracking}.",
        msgWebhookReturn: "تمت محاكاة إشعار الإرجاع لـ {tracking}.",
        whatsAppTooltip: "تأكيد فوري عبر واتساب",
        whatsAppMsgTemplate: "مرحباً {name}، نتواصل معك بخصوص طلبك {product} على فايت دروب. هل تؤكد استلام الطلب إلى {wilaya}؟",
        callAttemptsLabel: "اتصالات",
        markAttemptBtn: "تعذر الرد",
        strikeBadge: "{count}/3 اتصالات",
        strikeMaxAlert: "3 محاولات فاشلة - يُنصح بإلغاء الطلب",
        solvencyRunwayText: "التغطية التقديرية: ~{count} طلبات CPA مغطاة",
        hotkeyTip: "اختصارات: [C] تأكيد • [X] إلغاء • [R] تحديث",
        operatorHotkeysTitle: "اختصارات مركز الاتصال",
        batchSelectedCount: "تم تحديد {count} طلبات",
        batchTotalCpa: "إجمالي CPA:",
        batchConfirmBtn: "تأكيد الطلبات المحددة ({count})",
        batchConfirmSuccess: "تم تأكيد {count} طلبات بنجاح!",
        batchCallAttemptBtn: "+1 تسجيل تعذر الرد",
        batchCallAttemptSuccess: "تم تسجيل محاولة اتصال لـ {count} طلبات.",
        batchDeselectBtn: "إلغاء التحديد",
        focusModeToggle: "وضع الاتصال السريع",
        focusLeadProgress: "طلب {current} من {total}",
        focusConfirmNext: "تأكيد والتالي",
        focusNext: "التالي",
        focusPrev: "السابق",
        focusClose: "إغلاق وضع الاتصال",
        selectAllLeads: "تحديد الكل",
      },
      orders: {
        logisticsBadge: "الخدمات اللوجستية والشحن",
        title: "بوالص الشحن والإرسال",
        subtitle: "إصدار بوالص الشحن لشركات التوصيل (Yalidine و ZR Express) وتتبع الطرود المسلمة",
        refresh: "تحديث",
        searchPlaceholder: "بحث برقم الطلب، العميل، الهاتف، أو رقم التتبع...",
        allWilayas: "جميع الولايات (58)",
        tabAll: "الكل",
        tabToDispatch: "مؤكد للارسال",
        tabDispatched: "تم تسليم الطرد",
        tabInTransit: "قيد النقل",
        tabDelivered: "تم التسليم",
        tabRto: "مرتجع",
        colOrderRef: "رقم الطلب",
        colRecipient: "الزبون والوجهة",
        colWaybillTracking: "بوليصة الشحن",
        colStatus: "الحالة",
        colCpaCost: "تكلفة CPA",
        colActions: "إجراءات الشحن",
        waitingWaybill: "في انتظار البوليصة",
        waybillYalidine: "إنشاء بوليصة",
        simulateDelivered: "محاكاة تسليم",
        simulateDeliveredMobile: "محاكاة تسليم الطرد",
        deliveredSettled: "تم التحصيل والخصم",
        copy: "نسخ",
        copyTrackingTitle: "نسخ رقم التتبع",
        emptyOrders: "لا توجد شحنات مطابقة",
        msgDispatched: "تم إصدار بوليصة Yalidine بنجاح. الطرد في مرحلة الشحن.",
        msgWebhookDelivered: "تمت محاكاة إشعار تسليم الشحنة بنجاح ({status}).",
      },
      products: {
        catalogBadge: "كتالوج المورد • الملاءة الآلية",
        activeProductsSuffix: "منتجات معتمدة",
        title: "كتالوج المنتجات والأسعار",
        subtitle: "تحديد ميزانية CPA، تتبع كميات المخزون، والتحقق الفوري من تغطية رصيد الضمان المالي",
        refresh: "تحديث",
        recharge: "شحن الرصيد",
        addProduct: "إضافة منتج جديد",
        close: "إغلاق",
        searchPlaceholder: "بحث بالاسم أو المعرف...",
        filterAll: "الكل",
        filterActive: "نشط",
        filterOutOfStock: "نفذ المخزون",
        emptySearch: "لا توجد منتجات مطابقة للبحث",
        emptyCatalog: "لا توجد منتجات مسجلة في الكتالوج",
        stockLow: "مخزون منخفض",
        statusActive: "نشط",
        stock: "المخزون",
        price: "سعر البيع",
        grossCpa: "CPA Brut",
        netAffiliate: "عمولة المسوق (80%):",
        colProductRef: "المنتج / المعرف",
        colStockCurrent: "المخزون المتوفر",
        colRetailPrice: "سعر البيع للزبون",
        colBudgetGrossCpa: "ميزانية CPA الإجمالية",
        colNetAffiliate: "حصة المسوق (80%)",
        colStatus: "الحالة",
        colPerformance: "معدل التسليم والأداء",
        deliveryRate: "نسبة التسليم",
        rtoRate: "نسبة المرتجع (RTO)",
        healthOptimal: "نسبة ممتازة",
        healthStandard: "عادية",
        healthWarning: "تحذير مرتجعات",
        simulatorTitle: "حاسبة الربحية وهامش الأمان للمرتجع",
        simulatorSubtitle: "حساب تقديري لهامش الربح الحقيقي مع احتساب نسبة التوصيل في الجزائر (معدل 70%)",
        costPriceLabel: "تكلفة شراء/إنتاج القطعة الواحدة",
        costPricePlaceholder: "مثال: 1800",
        estDeliveryRateLabel: "نسبة التوصيل المتوقعة (%)",
        deliveryFeeLabel: "متوسط تكلفة التوصيل",
        netMarginPerOrder: "صافي الربح المتوقع لكل طلبية:",
        breakEvenThreshold: "عتبة الربحية (الحد الأدنى للتسليم):",
        breakEvenSafe: "هامش ربح آمن وممتاز",
        breakEvenCaution: "حساس لنسبة المرتجع",
        breakEvenLoss: "تحذير: خطر الخسارة",
        units: "قطعة",
        msgCreated: "تم إنشاء المنتج وتفعيله بنجاح في الكتالوج.",
      },
      wallet: {
        escrowBadge: "حساب الضمان المالي Escrow",
        movementsSuffix: "حركات مالية",
        title: "المحفظة وسجل المعاملات",
        subtitle: "إدارة رصيد الضمان المسبق وتتبع القيود المحاسبية لعمولات التوصيل والإيداعات",
        refresh: "تحديث",
        recharge: "إيداع وتعبئة الرصيد",
        cardBalanceTitle: "الرصيد المتاح حالياً",
        lowBalanceWarning: "تنبيه: الرصيد أقل من الحد الأدنى للضمان (3,000 د.ج)",
        sufficientBalance: "رصيد كافٍ لتغطية الشحنات الحالية",
        cardDepositsTitle: "إجمالي الإيداعات",
        cardDepositsDesc: "إجمالي المبالغ المشحونة عبر BaridiMob / CCP",
        cardDebitsTitle: "عمولات التسليم المقتطعة",
        cardDebitsDesc: "0 د.ج عند المرتجع (RTO)",
        searchPlaceholder: "بحث برقم القيد أو البيان...",
        filterAll: "الكل",
        filterDeposits: "إيداعات",
        filterDebits: "اقتطاعات",
        emptyFiltered: "لا توجد معاملات مطابقة",
        emptyLedger: "لا توجد معاملات مسجلة في هذا النطاق",
        depositCredit: "إيداع (CREDIT)",
        depositCreditTable: "إيداع رصيد (CREDIT)",
        debitDelivery: "خصم تسليم (DEBIT)",
        debitDeliveryTable: "خصم تسليم طلب (DEBIT)",
        refRecharge: "شحن رصيد الضمان",
        refDeliveryCpa: "عمولة توصيل CPA",
        colTxRef: "رقم القيد",
        colType: "النوع",
        colDetails: "البيان / تفاصيل العملية",
        colDateTime: "التاريخ",
        colAmount: "المبلغ",
        exportCsvBtn: "تصدير كشف الحساب CSV",
        exportSuccess: "تم تنزيل كشف الحساب بصيغة CSV بنجاح.",
        timeframeAll: "كل الفترات",
        timeframeToday: "اليوم",
        timeframeLast7Days: "آخر 7 أيام",
        timeframeThisMonth: "هذا الشهر",
        gaugeTitle: "الملاءة التنبؤية ومؤشر استمرارية الرصيد",
        gaugeSubtitle: "تحليل مباشر لعمولات CPA قيد الشحن مع ياليدين ونسبة تغطية رصيد الضمان",
        solvencyAvailableBalance: "الرصيد المتاح في الحساب",
        inTransitLiabilityTitle: "عمولات CPA المحجوزة في الطريق",
        inTransitLiabilityDesc: "إجمالي العمولات الملتزم بها للطلبيات المشحونة حالياً مع شركة التوصيل",
        netFreeMarginTitle: "الهامش المالي الحر المتبقي",
        netFreeMarginDesc: "الرصيد الصافي المتاح لتفعيل منتجات جديدة وحملات إعلانية إضافية",
        parcelsOnTheRoad: "طرد قيد التوصيل",
        runwayDeliveriesCount: "تغطية ~{count} تسليم ناجح",
        runwayOptimal: "رصيد آمن ومثالي (أكثر من 8 تسليمات)",
        runwayWarning: "تنبيه: يُفضل شحن الرصيد قبل عطلة نهاية الأسبوع",
        runwayCritical: "ملاءة حرجة: يلزم شحن الرصيد فوراً لتفادي الإيقاف",
        recommendedTopupTitle: "المبلغ المقترح للشحن حسب وتيرة التوصيل",
        recommendedTopupDesc: "بناءً على وتيرة الشحن الحالية، شحن ~{amount} يضمن استمرار إعلانات المسوقين لمدة 7 أيام دون انقطاع.",
        quickPresetsTitle: "مبالغ سريعة:",
        copiedAmount: "تم نسخ المبلغ!",
      },
    },
  },
};

export function getLocalizedAuthError(rawError: any, lang: Language): string {
  const msg = (
    typeof rawError === "string"
      ? rawError
      : rawError?.data?.message || rawError?.message || ""
  ).toString();

  const status = rawError?.status || rawError?.statusCode;

  // 1. Invalid Credentials / Unauthorized (401)
  if (
    status === 401 ||
    msg.includes("Identifiants invalides") ||
    msg.toLowerCase().includes("invalid credentials")
  ) {
    if (lang === "ar") {
      return "بيانات الدخول غير صحيحة (يرجى التحقق من البريد الإلكتروني أو كلمة المرور).";
    }
    if (lang === "en") {
      return "Invalid credentials (incorrect email or password).";
    }
    return "Identifiants invalides (e-mail ou mot de passe incorrect).";
  }

  // 2. Email Already Verified
  if (
    msg.includes("déjà associée à un compte vérifié") ||
    msg.toLowerCase().includes("already associated with a verified") ||
    rawError?.data?.error === "EMAIL_ALREADY_VERIFIED"
  ) {
    if (lang === "ar") {
      return "هذا البريد الإلكتروني مسجل ومفعل بالفعل. يرجى تسجيل الدخول مباشرة.";
    }
    if (lang === "en") {
      return "This email address is already associated with an active account. Please sign in.";
    }
    return "Cette adresse e-mail est déjà associée à un compte vérifié. Veuillez vous connecter.";
  }

  // 3. Email Already in Use
  if (
    msg.includes("déjà utilisée") ||
    msg.toLowerCase().includes("already in use")
  ) {
    if (lang === "ar") {
      return "هذا البريد الإلكتروني مستخدم بالفعل.";
    }
    if (lang === "en") {
      return "This email address is already in use.";
    }
    return "Cette adresse e-mail est déjà utilisée.";
  }

  // 4. Inactive or Disabled Account
  if (
    msg.includes("inactif ou désactivé") ||
    msg.toLowerCase().includes("inactive or disabled")
  ) {
    if (lang === "ar") {
      return "هذا الحساب غير نشط أو تم تعطيله. يرجى التواصل مع الدعم.";
    }
    if (lang === "en") {
      return "This account is inactive or has been disabled. Please contact support.";
    }
    return "Ce compte est inactif ou désactivé. Veuillez contacter le support.";
  }

  // 5. Cooldown / Rate Limiting ("Veuillez patienter X secondes...")
  if (
    msg.includes("patienter") ||
    msg.toLowerCase().includes("wait") ||
    status === 429
  ) {
    const match = msg.match(/\d+/);
    const sec = match ? match[0] : "15";
    if (lang === "ar") {
      return `يرجى الانتظار ${sec} ثانية قبل إعادة المحاولة.`;
    }
    if (lang === "en") {
      return `Please wait ${sec} second(s) before trying again.`;
    }
    return `Veuillez patienter ${sec} seconde(s) avant de soumettre à nouveau vos informations.`;
  }

  // 6. Incorrect OTP Code
  if (
    msg.includes("Code de confirmation incorrect") ||
    msg.toLowerCase().includes("incorrect verification code")
  ) {
    if (lang === "ar") {
      return "رمز التأكيد غير صحيح. يرجى التأكد من الرمز وإعادة المحاولة.";
    }
    if (lang === "en") {
      return "Incorrect verification code. Please check your code and try again.";
    }
    return "Code de confirmation incorrect. Veuillez vérifier le code et réessayer.";
  }

  // 7. Expired OTP Code
  if (
    msg.includes("a expiré") ||
    msg.toLowerCase().includes("expired")
  ) {
    if (lang === "ar") {
      return "انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.";
    }
    if (lang === "en") {
      return "This verification code has expired. Please request a new code.";
    }
    return "Ce code de vérification a expiré. Veuillez demander un nouveau code.";
  }

  // 8. Max attempts exceeded
  if (
    msg.includes("Nombre maximal de tentatives dépassé") ||
    msg.toLowerCase().includes("maximum attempts")
  ) {
    if (lang === "ar") {
      return "تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد.";
    }
    if (lang === "en") {
      return "Maximum attempts exceeded. Please request a new code.";
    }
    return "Nombre maximal de tentatives dépassé. Veuillez demander un nouveau code.";
  }

  // 9. No Pending Verification Code
  if (
    msg.includes("Aucun code de vérification en attente") ||
    msg.toLowerCase().includes("no pending verification")
  ) {
    if (lang === "ar") {
      return "لا يوجد رمز تأكيد معلق لهذا البريد الإلكتروني.";
    }
    if (lang === "en") {
      return "No pending verification code found for this email address.";
    }
    return "Aucun code de vérification en attente pour cette adresse e-mail.";
  }

  // 10. Required fields validation
  if (
    msg.includes("Veuillez remplir tous les champs") ||
    msg.includes("Veuillez indiquer votre adresse e-mail") ||
    msg.includes("Adresse e-mail requise")
  ) {
    if (lang === "ar") {
      return "يرجى ملء جميع الحقول المطلوبة.";
    }
    if (lang === "en") {
      return "Please fill in all required fields.";
    }
    return msg;
  }

  // 11. Password minimum length
  if (msg.includes("au moins 6 caractères")) {
    if (lang === "ar") {
      return "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.";
    }
    if (lang === "en") {
      return "Password must be at least 6 characters long.";
    }
    return msg;
  }

  // 12. Algerian phone validation
  if (
    msg.includes("Format algérien invalide") ||
    msg.includes("Numéro invalide (doit commencer par 05, 06 ou 07)")
  ) {
    if (lang === "ar") {
      return "صيغة رقم الهاتف الجزائري غير صالحة (يجب أن يبدأ بـ 05 أو 06 أو 07).";
    }
    if (lang === "en") {
      return "Invalid Algerian phone format (must start with 05, 06, or 07).";
    }
    return msg;
  }

  // 13. Supplier company requirement
  if (msg.includes("nom de l'entreprise ou marque est obligatoire")) {
    if (lang === "ar") {
      return "اسم الشركة أو العلامة التجارية إلزامي للموردين.";
    }
    if (lang === "en") {
      return "Company or brand name is required for suppliers.";
    }
    return msg;
  }

  // 14. Password mismatch
  if (msg.includes("ne correspondent pas")) {
    if (lang === "ar") {
      return "كلمتا المرور غير متطابقتين.";
    }
    if (lang === "en") {
      return "Passwords do not match.";
    }
    return msg;
  }

  // 15. Reset token required or invalid
  if (msg.includes("jeton de réinitialisation est requis")) {
    if (lang === "ar") {
      return "رمز استعادة كلمة المرور مطلوب.";
    }
    if (lang === "en") {
      return "Reset token is required.";
    }
    return msg;
  }

  if (msg.includes("invalide ou a expiré") || msg.includes("Code invalide ou expiré")) {
    if (lang === "ar") {
      return "الرمز أو الرابط غير صالح أو منتهي الصلاحية.";
    }
    if (lang === "en") {
      return "This code or reset link is invalid or has expired.";
    }
    return msg;
  }

  // 16. 6-digit OTP code required
  if (msg.includes("6 chiffres du code")) {
    if (lang === "ar") {
      return "يرجى إدخال الأرقام الستة للرمز المرسل عبر البريد الإلكتروني.";
    }
    if (lang === "en") {
      return "Please enter the 6-digit verification code sent to your email.";
    }
    return msg;
  }

  // Generic fallback if network error
  if (!msg || msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("fetch failed")) {
    if (lang === "ar") return "تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجددًا.";
    if (lang === "en") return "Unable to connect to the server. Please check your internet connection and try again.";
    return "Impossible de joindre le serveur. Veuillez vérifier votre connexion Internet et réessayer.";
  }

  return msg;
}
