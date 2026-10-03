---
name: vitedrop-cpa-logic
description: Enforces the Algerian Cash-on-Delivery (COD) CPA Affiliate Network rules specifically for the ViteDrop platform. Use this for any task involving affiliate tracking, order state machines, supplier billing ledgers, or courier webhooks.
---
# ViteDrop: Algerian COD CPA Affiliate Network Rules

## Context

This project is ViteDrop, an Algerian COD CPA Affiliate Network. This is NOT a traditional dropshipping platform.

  - **Suppliers (Fournisseurs)** own the products, set the retail price, define the total CPA budget, and run the call centers.
  - **Affiliates (Media Buyers)** drive traffic to ViteDrop-hosted landing pages using unique tracking links.
  - **ViteDrop (The Platform)** acts as the tracking engine and escrow. We do not process credit cards. Transactions are completed in physical cash by couriers (e.g., Yalidine, ZR Express) at the customer's door.

## Mandatory Rules for the Agent

### 1. The Lead & Order State Machine

You must ONLY use the following exact states for an order/lead within ViteDrop:

  * `lead_generated`: Customer filled out the form via a ViteDrop affiliate link.
  * `canceled`: Supplier's call center marked the lead as fake, duplicate, or the customer declined.
  * `supplier_confirmed`: Supplier confirmed intent via phone.
  * `dispatched`: Waybill (bordereau) generated via ViteDrop's integrated courier API.
  * `in_transit`: Package picked up by courier.
  * `delivered`: Courier webhook confirms cash was collected.
  * `rto_in_transit`: Customer refused (Return to Origin); package heading back to the supplier.
  * `returned_to_supplier`: Supplier confirmed physical receipt of the RTO.

**Constraint:** The `delivered` state can ONLY be triggered by a webhook from the courier API, never by manual supplier input. This prevents "lead shaving" (suppliers stealing affiliate commissions from ViteDrop affiliates).

### 2. Financial Immutability & Billing Flow

Never write SQL or ORM code that uses flat updates (e.g., `UPDATE wallets SET balance = balance + X`). You must use a strictly typed double-entry accounting ledger via a `wallet_transactions` table.

**Strict Transaction Enum Types:** 
You must ONLY use: `DEPOSIT` (wallet top-ups), `WITHDRAWAL`, `CPA_PAYOUT` (credit to affiliate), `PLATFORM_FEE` (credit to platform), and `SUPPLIER_DEBIT`. (Do NOT use generic terms like "CREDIT" or "DEBIT").

* **The Invisible Spread Model (20% Cut):**
  The system splits the Supplier's Total CPA Budget into an Affiliate Net Payout (80%) and a Platform Fee (20%). Affiliates never see the Platform Fee. 
* **On `delivered`:**
  1. Debit the Supplier's wallet (`SUPPLIER_DEBIT` for the Gross CPA).
  2. Credit the Affiliate's wallet (`CPA_PAYOUT` for the 80% Net Payout).
  3. Credit the ViteDrop Platform wallet (`PLATFORM_FEE` for the 20% cut).
* **On `rto_in_transit` / `Retour`:**
  * The Affiliate earns 0 DZD.
  * **CRITICAL:** ViteDrop is a "Prepaid Escrow Model" where Suppliers own their private courier API accounts. Because the Supplier is billed directly by the courier in real life for the wasted shipping label, **ViteDrop DOES NOT deduct any platform penalty from the Supplier's wallet on RTO.** The wallet balance remains untouched for both parties.
* Suppliers operate on a prepaid billing model. Their wallets are automatically generated upon registration, and they must top-up (`DEPOSIT`) to cover their budgets.

### 3. Affiliate Tracking & Pixels (Server-Side)

  * Any database schema for `orders` or `leads` MUST include an `affiliate_id` and tracking metadata (`click_id`, `fbclid`, `ttclid`).
  * ViteDrop's backend architecture must include a worker queue (e.g., Redis/BullMQ) dedicated to firing Server-Side API events (Facebook Conversions API / TikTok Events API) to report "Purchase" events back to the affiliate's ad accounts upon the `lead_generated` or `delivered` state.

### 4. Courier API as the Single Source of Truth

  * Suppliers must NOT use their private courier accounts to ship ViteDrop orders. The backend must generate Yalidine/ZR Express waybills using ViteDrop's master API keys.
  * Implement row-level database locks (e.g., `SELECT ... FOR UPDATE` in PostgreSQL) on webhook listeners to prevent race conditions from duplicate courier webhook payloads.

### 5. Geographical Data

  * ViteDrop checkout forms and delivery pricing modules must exclusively rely on the official 58 Algerian Wilayas and their associated Communes.
