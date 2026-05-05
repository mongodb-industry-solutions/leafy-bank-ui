// ledgerReducer.js — single mutation surface for the ledger flow demo.

export const initialState = {
  status: "IDLE", // IDLE | RUNNING | SETTLED
  currentStage: null,
  reachedStages: {}, // { [stageKey]: timestampMs }
  events: [], // append-only ordered list, drives ActivityPanel
  documents: {
    journalEntry: null,
    subLedgerEntries: [],
  },
  balances: {}, // { [accountId]: { displayName, before, current, ceiling } }
  identifiers: {
    journalId: null,
    idempotencyKey: null,
    paymentId: null,
    resumeToken: null,
  },
  payment: { amount: 0, currency: "USD" },
  totals: { debit: 0, credit: 0 }, // running sums of posted legs
  startedAt: null,
  settledAt: null,
};

export function ledgerReducer(state, action) {
  switch (action.type) {
    case "RESET":
      return { ...initialState };

    case "START": {
      const { from, to, identifiers, amount, currency } = action;
      // Vessel ceilings — used to scale water-level fill. Generous so the
      // post-payment level still has visible headroom.
      const ceiling = Math.max(from.balance, to.balance) * 1.4;
      return {
        ...initialState,
        status: "RUNNING",
        startedAt: Date.now(),
        identifiers: {
          journalId: identifiers.journalId,
          idempotencyKey: identifiers.idempotencyKey,
          paymentId: identifiers.paymentId,
          resumeToken: null,
        },
        payment: { amount: amount || 0, currency: currency || "USD" },
        totals: { debit: 0, credit: 0 },
        balances: {
          [from.accountId]: { displayName: from.displayName, before: from.balance, current: from.balance, ceiling },
          [to.accountId]: { displayName: to.displayName, before: to.balance, current: to.balance, ceiling },
        },
      };
    }

    case "STAGE_EVENT": {
      const { event } = action;
      const { stage, payload = {} } = event;
      const next = {
        ...state,
        currentStage: stage,
        reachedStages: { ...state.reachedStages, [stage]: Date.now() },
        events: [...state.events, { stage, payload, at: Date.now() }],
      };

      switch (stage) {
        case "SUBLEDGER_DEBIT":
        case "SUBLEDGER_CREDIT": {
          if (payload.document) {
            next.documents = {
              ...next.documents,
              subLedgerEntries: [...next.documents.subLedgerEntries, payload.document],
            };
            const amt = state.payment?.amount || 0;
            next.totals = {
              debit: state.totals.debit + (stage === "SUBLEDGER_DEBIT" ? amt : 0),
              credit: state.totals.credit + (stage === "SUBLEDGER_CREDIT" ? amt : 0),
            };
          }
          return next;
        }

        case "JOURNAL_POSTED":
          if (payload.document) {
            next.documents = { ...next.documents, journalEntry: payload.document };
          }
          return next;

        case "CHANGE_STREAM":
          next.identifiers = { ...next.identifiers, resumeToken: payload.resumeToken || null };
          return next;

        case "BALANCE_PROJECTED_DEBIT":
        case "BALANCE_PROJECTED_CREDIT": {
          const { accountId, after } = payload;
          if (!accountId || !state.balances[accountId]) return next;
          next.balances = {
            ...state.balances,
            [accountId]: { ...state.balances[accountId], current: after },
          };
          return next;
        }

        case "SETTLED":
          next.status = "SETTLED";
          next.settledAt = Date.now();
          return next;

        default:
          return next;
      }
    }

    default:
      return state;
  }
}
