// transactions_api.js
/**
 * Client helpers for the payments / transfers backend (BIAN PaymentOrderProcedure).
 *
 * Phase 5 (BIAN flip):
 *   - Both helpers now post to a single BIAN URL: `/PaymentOrderProcedure/Initiate`.
 *     The backend rail/type is identical for transfers and digital payments in Phase 1
 *     (`PaymentType: INTRABANK_TRANSFER`, `PaymentRailType: INTERNAL`).
 *     `performDigitalPayment` keeps the cosmetic `paymentMethod` field; it lands as
 *     `RemittanceUnstructuredInformationText: "via Paypal"`.
 *   - `fetchRecentTransactionsForUser` was removed — relocated to the accounts service
 *     under `fetchRecentActivityForCustomer` in `lib/api/accounts/accounts_api.js`.
 *
 * Legacy `transactionData` shape (for back-compat in callers):
 *   {
 *     account_id_sender:    "ACC-…",  (post-flip; was ObjectId pre-flip)
 *     account_id_receiver:  "ACC-…",
 *     transaction_amount:   number,
 *     sender_user_id:       USER_MAP key (24-hex),
 *     payment_method?:      "Paypal" | "Zelle" | "Venmo",
 *     ...other display-only fields the backend now ignores
 *   }
 *
 * @module transactions_api
 * @exports performAccountTransfer
 * @exports performDigitalPayment
 */

import {
    uiTransferToBian,
    bianPaymentInitiateToUi,
} from "@/lib/adapters/bian-to-ui";
import { deriveCustomerRef } from "@/lib/api/refs";

const PAYMENT_BASE = "/api/PaymentOrderProcedure";

async function postPaymentInitiate(body) {
    const response = await fetch(`${PAYMENT_BASE}/Initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        throw new Error(`Payment initiate failed: ${response.status}`);
    }
    return response.json();
}

/**
 * Account-to-account transfer (Phase 1: INTRABANK_TRANSFER on the INTERNAL rail).
 * @param {object} transactionData - legacy form payload (see module docstring)
 */
export async function performAccountTransfer(transactionData) {
    const body = uiTransferToBian({
        customerRef: deriveCustomerRef(transactionData.sender_user_id),
        originatorAccountRef: transactionData.account_id_sender,
        beneficiaryAccountRef: transactionData.account_id_receiver,
        amount: transactionData.transaction_amount,
    });
    const envelope = await postPaymentInitiate(body);
    return bianPaymentInitiateToUi(envelope);
}

/**
 * Digital payment — same backend route in Phase 1; only the remittance text differs.
 * @param {object} transactionData - legacy form payload + `payment_method`
 */
export async function performDigitalPayment(transactionData) {
    const body = uiTransferToBian({
        customerRef: deriveCustomerRef(transactionData.sender_user_id),
        originatorAccountRef: transactionData.account_id_sender,
        beneficiaryAccountRef: transactionData.account_id_receiver,
        amount: transactionData.transaction_amount,
        paymentMethod: transactionData.payment_method,
    });
    const envelope = await postPaymentInitiate(body);
    return bianPaymentInitiateToUi(envelope);
}
