"use client";

import StageCanvas from "../LedgerFlow/StageCanvas";

export default function PostingCanvas({ state }) {
  // In v2 the membrane between sub-ledger writes and the GL commit is the
  // engine-reconcile gate (Pacioli / SoD / idempotency), not an EOD label.
  return <StageCanvas state={state} reconcileSublabel="Engine gates" />;
}
