# Withdrawal QA Results

**Test date:** 2026-10-08  
**Environment:** Local ViteDrop frontend and backend  
**Frontend:** `http://localhost:3000`  
**Backend:** `http://localhost:4000`  
**Admin route:** `/admin/withdrawals`

## Summary

The admin withdrawal queue was tested against real local API records and browser interactions. BaridiMob and CCP rendering, approval, rejection, payment completion, failed-payment handling, validation, authorization, duplicate mutation guards, ledger effects, Arabic RTL behavior, and responsive layouts were verified.

The executed withdrawal flows passed. Dedicated automated withdrawal coverage remains blocked because the backend does not currently provide isolated repeatable fixtures, including a withdrawal at or above the `20,000 DZD` priority threshold.

## Fixtures Tested

| Fixture | Method | Amount | Result |
|---|---|---:|---|
| `f096a5a3-c794-4c05-8b7c-d44a2f8f9d7f` | BaridiMob | `800 DZD` | `PAID` |
| `ccea2292-ab98-458d-b4be-b5f71366213b` | CCP | `800 DZD` | `REJECTED` |
| `666be5ec-807c-4ce4-aad8-b099927ad53b` | BaridiMob | `800 DZD` | `FAILED` |

The fixtures were created through the authenticated wallet API. They were not mocked in the frontend.

## Mutation Results

### CCP rejection

- Initial state: `PENDING`
- Final state: `REJECTED`
- Rejection reason: `QA fixture: CCP recipient validation`
- Affiliate balance was restored by `800 DZD`.
- The queue refreshed and displayed the rejected status.
- A second rejection attempt was rejected by the backend with HTTP `400`.

### BaridiMob approval and payment

- Initial state: `PENDING`
- Approval note: `QA fixture: BaridiMob approval`
- Intermediate state: `APPROVED`
- Payment reference: `BMOB-REC-QA-001`
- Payment note: `QA fixture: BaridiMob payment`
- Final state: `PAID`
- The payment reference was persisted and displayed in the queue.
- A second payment attempt was rejected by the backend with HTTP `400`.

### BaridiMob failed payment

- Initial state: `PENDING`
- Approval note: `QA fixture: Arabic approval`
- Intermediate state: `APPROVED`
- Failure reason: `QA fixture: postal account blocked`
- Final state: `FAILED`
- Affiliate balance was restored by `800 DZD`.

## Validation and Error Handling

The following client-side validations were verified:

- Rejection cannot be submitted without a reason.
- Failed-payment handling cannot be submitted without a reason.
- Payment completion cannot be submitted without a payment reference.
- Whitespace-only required fields are rejected.
- The modal remains available for correction when validation fails.

The following API protections were verified:

| Scenario | Result |
|---|---|
| Non-admin attempts an admin mutation | HTTP `403` |
| Duplicate failed-payment mutation | HTTP `400` |
| Duplicate paid mutation | HTTP `400` |

## UI and Localization Results

Verified on the admin withdrawal page:

- BaridiMob payout rail badge renders with the cyan treatment.
- CCP / Algérie Poste payout rail badge renders with the amber treatment.
- Amounts and technical identifiers use the expected financial/monospace presentation.
- Status filters render and update the queue.
- Search controls are present.
- Post-mutation refresh reflects server state.
- French labels and modal actions render correctly.
- Arabic labels render correctly.
- Arabic switches the operational surface to RTL.
- Arabic approval and failed-payment modals were opened and submitted successfully.

## Responsive Results

No document-level horizontal overflow was detected at:

| Viewport | Result |
|---:|---|
| `390x900` | Pass |
| `768x900` | Pass |
| `1440x900` | Pass |

The responsive check confirmed that the queue remains within the viewport at phone, tablet, and desktop widths.

## Financial and Ledger Verification

The final affiliate wallet balance was:

```text
800 DZD
```

This matched the expected balance after:

1. Starting with a `1,600 DZD` CPA payout.
2. Reserving two `800 DZD` withdrawals.
3. Refunding the CCP rejection.
4. Completing the BaridiMob payment without refund.
5. Refunding the failed BaridiMob payment.

The wallet transaction records were linked to their withdrawal IDs. Reservation and refund amounts were mathematically correct, and no duplicate refund was created during the tested duplicate requests.

## Accounting Finding

Rejection and failed-payment refunds currently use positive transactions with the existing `WITHDRAWAL` transaction type:

```text
WITHDRAWAL_REFUND
WITHDRAWAL_FAILED_REFUND
```

The balance calculations were correct and the entries were auditable. However, this transaction-type choice should be reviewed against the project's strict double-entry accounting rules. The backend currently has no dedicated refund enum value, so this was recorded as a follow-up finding rather than changed during frontend QA.

## Blockers and Follow-up Work

### Missing priority-threshold fixture

The seeded affiliate wallet had only `1,600 DZD`, so safe API-backed fixtures could only be created at `800 DZD`.

The following cases remain unverified against real records:

- Amount below `20,000 DZD` with the priority flag explicitly absent.
- Amount exactly `20,000 DZD` with the priority flag present.
- Amount above `20,000 DZD` with the priority flag present.

A sanctioned test-only wallet top-up or isolated backend fixture mechanism is required.

### Dedicated withdrawal Playwright suite

The existing authentication/RBAC suite had previously passed `6/6`. During the final QA rerun, two authentication tests intermittently failed because of local Next.js development-server redirect timing. This was unrelated to withdrawal behavior.

Dedicated withdrawal Playwright automation should be added after repeatable backend fixtures are available. It should cover:

- BaridiMob and CCP records.
- Priority-threshold amounts.
- Approve, reject, paid, and failed transitions.
- Mutation error recovery.
- Duplicate submission protection.
- Arabic RTL modal behavior.
- Responsive queue and modal layouts.

## Validation Commands

The following checks were run:

```powershell
npx tsc --noEmit
npx eslint src/app/admin/withdrawals/page.tsx src/components/admin/withdrawal-action-modal.tsx playwright.config.ts tests/auth-rbac.spec.ts
npm run test:e2e -- --workers=1
git diff --check
```

Results:

- TypeScript: passed.
- Focused withdrawal/E2E ESLint: passed.
- Git diff check: passed.
- Authentication/RBAC E2E: previously verified at `6/6`; the final rerun was affected by intermittent development-server redirect timing.

## Test Data Status

The three local withdrawal fixtures remain in the local database as immutable financial QA evidence. No production data was used, and no test fixture was deleted after mutation because the associated ledger entries are immutable.
