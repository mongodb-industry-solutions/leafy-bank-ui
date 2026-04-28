// refs.js
/**
 * String-ref derivation helpers — JS mirror of `backend/shared/refs.py` `derive_ref`.
 *
 * The v4 BIAN data model uses typed string refs (`CUST-xxxxxxxx`, `ACC-xxxxxxxx`,
 * `PAY-xxxxxxxx`) as public identifiers. The UI never sees raw ObjectIds on the wire.
 *
 * USER_MAP keys in `lib/constants.js` are 24-char ObjectId-shaped strings; the
 * customers seed data was generated with `derive_ref("CUST", oid, last_n=8)` so
 * `lastN(userId, 8)` round-trips deterministically. Keep this formula in lock-step
 * with `backend/shared/refs.py` — drift here breaks every account-scoped call.
 *
 * @module refs
 * @exports deriveCustomerRef
 * @exports deriveRef
 */

/**
 * Build a typed string ref from an ObjectId-shaped string.
 * @param {string} prefix - e.g. "CUST", "ACC", "PAY", "TXN".
 * @param {string} oid - 24-hex ObjectId or any string; last `lastN` chars are taken.
 * @param {number} [lastN=8] - number of trailing chars to keep.
 * @returns {string}
 */
export function deriveRef(prefix, oid, lastN = 8) {
    const s = String(oid || "");
    return `${prefix}-${s.slice(-lastN)}`;
}

/**
 * Customer ref from a USER_MAP user id.
 * @param {string} userId - 24-hex ObjectId-shaped string from USER_MAP.
 * @returns {string} e.g. "CUST-17352702".
 */
export function deriveCustomerRef(userId) {
    return deriveRef("CUST", userId, 8);
}
