// ledgerReducer.js — single mutation surface for the ledger flow demo.

import { STAGE_LIST, indexOfStage } from "./stageNarration";

export const initialState = {
  // Lifecycle
  status: "IDLE", // IDLE | STEP_PAUSED | AUTO_RUNNING | SETTLED
  mode: "SLOW",   // STEP | SLOW | DEMO
  currentStage: null,
  stageIndex: -1,
  reachedStages: {}, // { [stageKey]: timestampMs }
  events: [],        // append-only ordered list

  // Documents materialized progressively as stages fire
  documents: {
    journalEntry: null,
    subLedgerEntries: [],
  },

  // Vessel data
  balances: {}, // { [accountId]: { displayName, before, current, ceiling } }

  // Identifiers
  identifiers: {
    journalId: null,
    idempotencyKey: null,
    paymentId: null,
    resumeToken: null,
  },

  // Payment context
  payment: { amount: 0, currency: "USD" },

  // Equilibrium tracking — running sums of posted legs
  totals: { debit: 0, credit: 0 },

  // Timing
  startedAt: null,
  settledAt: null,

  // Transient — when STEP mode, the next event the simulator should emit
  // when the user presses Next. Set by the simulator runner; consumed by
  // the reducer's STEP_NEXT action.
  pendingNextEvent: null,

  // Persisted START arguments — used by STEP_PREV to rebuild the run state.
  runArgs: null,
};

export function ledgerReducer(state, action) {
  switch (action.type) {
    case "RESET":
      return { ...initialState, mode: state.mode };

    case "SET_MODE":
      return { ...state, mode: action.mode };

    case "START": {
      const { from, to, identifiers, amount, currency, mode } = action;
      const ceiling = Math.max(from.balance, to.balance) * 1.4;
      return {
        ...initialState,
        mode: mode || state.mode || "STEP",
        status: mode === "STEP" ? "STEP_PAUSED" : "AUTO_RUNNING",
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
        // Persist the START args so STEP_PREV can rebuild the run.
        runArgs: { from, to, identifiers, amount, currency, mode },
      };
    }

    case "STEP_PREV": {
      // Replay events[0..n-2] from a freshly-started state to step back one stage.
      if (!state.runArgs || (state.events?.length || 0) <= 1) return state;
      const events = state.events.slice(0, -1);
      let s = ledgerReducer(initialState, { type: "START", ...state.runArgs });
      for (const evt of events) {
        s = ledgerReducer(s, { type: "STAGE_EVENT", event: { stage: evt.stage, payload: evt.payload } });
      }
      // Force STEP_PAUSED — STEP_PREV is only valid in step mode.
      return { ...s, status: "STEP_PAUSED" };
    }

    case "STAGE_EVENT": {
      const { event } = action;
      const { stage, payload = {} } = event;
      const stageIndex = indexOfStage(stage);
      const next = {
        ...state,
        currentStage: stage,
        stageIndex,
        reachedStages: { ...state.reachedStages, [stage]: Date.now() },
        events: [...state.events, { stage, payload, at: Date.now() }],
        // STEP mode: stay paused after applying the event so the user can read it.
        // AUTO modes: stay running; the runner schedules the next event itself.
        status: state.mode === "STEP" ? "STEP_PAUSED" : "AUTO_RUNNING",
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

// Helper for the UI: is there a next stage available?
export function hasNextStage(state) {
  if (state.status === "SETTLED") return false;
  if (state.stageIndex < 0) return true; // not started
  return state.stageIndex < STAGE_LIST.length - 1;
}

// Helper: can we step backward? Need at least one prior event we can drop.
export function hasPrevStage(state) {
  return (state.events?.length || 0) > 1 && state.status !== "IDLE";
}
